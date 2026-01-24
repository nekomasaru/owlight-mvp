import { IRagService } from '../domain/interfaces/IRagService';
import { SearchResponse, Citation } from '../domain/types';
import { GoogleAuth } from 'google-auth-library';

export class VertexAiSearchService implements IRagService {
    private auth: GoogleAuth;
    private project: string;
    private location: string = 'global';
    private collection: string = 'default_collection';
    private engineId: string; // The Search App ID
    private datastoreId: string;

    constructor() {
        this.auth = new GoogleAuth({
            keyFilename: './gcp-key.json',
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });
        this.project = process.env.GCP_PROJECT_ID!;
        this.engineId = process.env.GCP_VERTEX_APP_ID || 'owlight-search';
        this.datastoreId = process.env.GCP_VERTEX_DATASTORE_ID!;
    }

    async search(query: string, conversationId?: string): Promise<SearchResponse> {
        const servingConfig = `projects/${this.project}/locations/${this.location}/collections/${this.collection}/engines/${this.engineId}/servingConfigs/default_serving_config`;
        const endpoint = `https://discoveryengine.googleapis.com/v1beta/${servingConfig}:answer`;

        try {
            const client = await this.auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse.token;

            if (!accessToken) {
                throw new Error("Failed to acquire Access Token");
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: { text: query },
                    session: conversationId ? `projects/${this.project}/locations/${this.location}/collections/${this.collection}/engines/${this.engineId}/sessions/${conversationId}` : undefined,
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                // console.error("[Vertex RAG] API Error Body:", errText); // Keep this if useful for future? maybe unnecessary logs in prod

                if (errText.includes("Large Language Model add-on")) {
                    console.error("CRITICAL: Vertex AI Search の 'Large Language Model add-on' が有効になっていません。GCPコンソールの Search and Conversation > Settings から有効化してください。");
                }

                throw new Error(`Vertex AI API returned ${response.status}: ${errText}`);
            }

            const data = await response.json();

            // data.answer.answerText
            const answer = data.answer?.answerText || ""; // removed fallback text here to let API decide

            let citations: Citation[] = [];

            // 1. Try standard citations field
            if (data.answer?.citations?.length > 0) {
                citations = data.answer.citations.map((c: any, index: number) => {
                    const sourceUri = c.sources?.[0]?.uri || c.uri || '';
                    const fileName = sourceUri.split('/').pop() || c.title || '参考資料';

                    console.log(`[Vertex] Std Citation ${index}: title="${c.title}", sourceUri="${sourceUri}", fileName="${fileName}"`);

                    return {
                        id: `cit-${index}`,
                        title: c.title || fileName,
                        fileName: fileName,
                        author: 'OWLight Knowledge',
                        contentSnippet: c.referencedChunks?.[0]?.chunkContent || '',
                        url: sourceUri
                    };
                });
            }
            // 2. Fallback: Try to extract from steps (search actions)
            else if (data.answer?.steps) {
                const searchResults: any[] = [];
                data.answer.steps.forEach((step: any) => {
                    step.actions?.forEach((action: any) => {
                        if (action.observation?.searchResults) {
                            searchResults.push(...action.observation.searchResults);
                        }
                    });
                });

                // Deduplicate by title/uri if needed, but for now just map
                citations = searchResults.map((result: any, index: number) => {
                    // Extract filename from document URI (e.g., gs://bucket/filename.docx)
                    const docUri = result.document || result.uri || '';
                    const fileName = docUri.split('/').pop() || result.title || '参考資料';

                    console.log(`[VertexService] Citation ${index}: title="${result.title}", docUri="${docUri}", fileName="${fileName}"`);

                    return {
                        id: `cit-step-${index}`,
                        title: result.title || fileName,
                        fileName: fileName, // Store actual filename with extension
                        author: 'OWLight Knowledge',
                        contentSnippet: result.snippetInfo?.[0]?.snippet || '',
                        url: docUri
                    };
                });
            }

            console.log(`[VertexService] Extracted Citations: ${citations.length}`);

            return { answer, citations };
        } catch (e) {
            console.error("Vertex AI Search Error:", e);
            return { answer: "検索中にエラーが発生しました。", citations: [] };
        }
    }

    async searchDocuments(query: string): Promise<Citation[]> {
        // Fallback or lightweight search
        const res = await this.search(query);
        return res.citations;
    }

    async importDocuments(gcsUri: string): Promise<void> {
        // Construct the branch resource name
        // projects/{project}/locations/{location}/collections/{collection}/dataStores/{data_store_id}/branches/{branch}
        const branchName = `projects/${this.project}/locations/${this.location}/collections/${this.collection}/dataStores/${this.datastoreId}/branches/0`;
        const endpoint = `https://discoveryengine.googleapis.com/v1beta/${branchName}/documents:import`;

        console.log(`[VertexService] Triggering Import for: ${gcsUri}`);
        console.log(`[VertexService] Target Branch: ${branchName}`);

        try {
            const client = await this.auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse.token;

            if (!accessToken) throw new Error("Failed to acquire Access Token");

            const body = {
                gcsSource: {
                    inputUris: [gcsUri],
                    dataSchema: "content" // Crucial for unstructured docs
                },
                reconciliationMode: "INCREMENTAL"
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Import failed with ${response.status}: ${errText}`);
            }

            const data = await response.json();
            console.log("[VertexService] Import Job ID:", data.name);

        } catch (e) {
            console.error("[VertexService] Import Error:", e);
            throw e;
        }
    }

    async listDocuments(): Promise<any[]> {
        // List all documents in the Vertex AI Search data store
        const branchName = `projects/${this.project}/locations/${this.location}/collections/${this.collection}/dataStores/${this.datastoreId}/branches/0`;
        const endpoint = `https://discoveryengine.googleapis.com/v1beta/${branchName}/documents`;

        try {
            const client = await this.auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse.token;

            if (!accessToken) throw new Error("Failed to acquire Access Token");

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("[VertexService] List Documents Error:", errText);
                throw new Error(`List documents failed with ${response.status}: ${errText}`);
            }

            const data = await response.json();
            return data.documents || [];

        } catch (e) {
            console.error("[VertexService] List Documents Error:", e);
            return [];
        }
    }

    // Delete a document from Vertex AI Search
    async deleteDocument(documentName: string): Promise<void> {
        try {
            const client = await this.auth.getClient();
            const tokenResponse = await client.getAccessToken();
            const accessToken = tokenResponse.token;

            if (!accessToken) {
                throw new Error("Failed to acquire Access Token");
            }

            // documentName is the full document name from the API response
            // Format: projects/{project}/locations/{location}/collections/{collection}/dataStores/{dataStore}/branches/{branch}/documents/{docId}
            const deleteUrl = `https://discoveryengine.googleapis.com/v1beta/${documentName}`;

            console.log(`[VertexService] Deleting document: ${documentName}`);

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("[VertexService] Delete Document Error:", errText);
                throw new Error(`Delete document failed with ${response.status}: ${errText}`);
            }

            console.log(`[VertexService] Successfully deleted document: ${documentName}`);

        } catch (e) {
            console.error("[VertexService] Delete Document Error:", e);
            throw e;
        }
    }
}
