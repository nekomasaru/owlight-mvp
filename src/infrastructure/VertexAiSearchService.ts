import { ISearchService } from '../domain/interfaces/ISearchService';
import { SearchResponse, Citation } from '../domain/types';
import { SearchServiceClient } from '@google-cloud/discoveryengine';

/**
 * VertexAISearchService
 * 
 * Simplified implementation that relies solely on Vertex AI Search.
 * All knowledge is synced immediately via documents.create API,
 * so no fallback to Supabase is needed.
 */
export class VertexAISearchService implements ISearchService {
    private client: SearchServiceClient;
    private projectId: string;
    private location: string;
    private dataStoreId: string;
    private collectionId: string;
    private appId: string;

    constructor() {
        this.client = new SearchServiceClient();

        this.projectId = process.env.GCP_PROJECT_ID || '';
        this.location = process.env.VERTEX_LOCATION || 'global';
        this.dataStoreId = process.env.VERTEX_DATA_STORE_ID || process.env.GCP_VERTEX_DATASTORE_ID || '';
        this.collectionId = process.env.VERTEX_COLLECTION_ID || 'default_collection';
        this.appId = process.env.GCP_VERTEX_APP_ID || '';

        if (!this.projectId || (!this.dataStoreId && !this.appId)) {
            console.warn('Vertex AI Search configuration missing: PROJECT_ID or (DATA_STORE_ID/APP_ID)');
        }
    }

    async search(query: string): Promise<SearchResponse> {
        if (!this.projectId) {
            console.error('Vertex AI Search not configured (Project ID missing).');
            return { answer: '', citations: [] };
        }

        let servingConfig = '';
        if (this.appId) {
            servingConfig = `projects/${this.projectId}/locations/${this.location}/collections/${this.collectionId}/engines/${this.appId}/servingConfigs/default_search`;
        } else {
            servingConfig = this.client.projectLocationCollectionDataStoreServingConfigPath(
                this.projectId,
                this.location,
                this.collectionId,
                this.dataStoreId,
                'default_search'
            );
        }

        try {
            const request: any = {
                pageSize: 10,
                query: query,
                servingConfig: servingConfig,
                contentSearchSpec: {
                    snippetSpec: {
                        returnSnippet: true,
                        maxSnippetCount: 5 // Keep snippet as fallback
                    },
                    extractiveContentSpec: {
                        maxExtractiveAnswerCount: 5, // Try to get direct answers
                        maxExtractiveSegmentCount: 5, // Get relevant segments
                        returnExtractiveSegmentScore: true
                    }
                }
            };

            console.log(`[VertexAISearch] Searching with query: "${query}"`);
            const [results] = await this.client.search(request, { autoPaginate: true });

            console.log(`[VertexAISearch] Found ${results?.length || 0} results.`);

            if (!results || results.length === 0) {
                return { answer: '', citations: [] };
            }

            const citations = results.map((result: any) => {
                const doc = result.document;
                const derived = doc?.derivedStructData;
                const struct = doc?.structData;

                // Helper to extract value from Protobuf struct
                const getVal = (source: any, key: string): any => {
                    if (!source) return null;
                    if (source[key] !== undefined && source[key] !== null) {
                        const val = source[key];
                        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                            if (val.stringValue !== undefined) return val.stringValue;
                            if (val.numberValue !== undefined) return val.numberValue;
                            return val;
                        }
                        return val;
                    }
                    const fields = source.fields || source;
                    if (fields && fields[key]) {
                        const val = fields[key];
                        if (val.stringValue !== undefined) return val.stringValue;
                        if (val.numberValue !== undefined) return val.numberValue;
                        return val;
                    }
                    return null;
                };

                // Extract snippets & extractive answers
                const contentParts: string[] = [];
                let jsonTitle = ''; // Move declaration up to allow early population

                const tryParseJsonContent = (text: string): { title?: string; content?: string } | null => {
                    if (!text) return null;
                    const trimmed = text.trim();
                    if (trimmed.startsWith('{') && trimmed.includes('"title"')) {
                        try {
                            // Handle potentially truncated JSON
                            const lastBrace = trimmed.lastIndexOf('}');
                            if (lastBrace > 0) {
                                const potentialJson = trimmed.substring(0, lastBrace + 1);
                                return JSON.parse(potentialJson);
                            }
                        } catch (e) { /* ignore parse error */ }
                    }
                    return null;
                };

                const addContent = (text: any) => {
                    if (!text || typeof text !== 'string') return;

                    // Check if this snippet is a JSON object containing title/content
                    const parsed = tryParseJsonContent(text);
                    if (parsed) {
                        if (parsed.title && !jsonTitle) {
                            jsonTitle = parsed.title;
                        }
                        if (parsed.content) {
                            const cleanedContent = parsed.content;
                            if (!contentParts.includes(cleanedContent)) {
                                contentParts.push(cleanedContent);
                            }
                        }
                    } else {
                        if (!contentParts.includes(text)) {
                            contentParts.push(text);
                        }
                    }
                };

                const tryExtract = (source: any) => {
                    if (!source) return;
                    const fields = source.fields || source;

                    // 1. Extractive Answers (Prioritize these as they are "answers")
                    const answers = fields.extractive_answers;
                    const ansList = (answers?.listValue?.values) || (Array.isArray(answers) ? answers : null);
                    if (Array.isArray(ansList)) {
                        for (const item of ansList) {
                            const itemStruct = item.structValue?.fields || item;
                            const text = getVal(itemStruct, 'content');
                            addContent(text);
                        }
                    }

                    // 2. Extractive Segments (Longer context)
                    const segments = fields.extractive_segments;
                    const segList = (segments?.listValue?.values) || (Array.isArray(segments) ? segments : null);
                    if (Array.isArray(segList)) {
                        for (const item of segList) {
                            const itemStruct = item.structValue?.fields || item;
                            const text = getVal(itemStruct, 'content');
                            addContent(text);
                        }
                    }

                    // 3. Fallback to Snippets
                    const snippets = fields.snippets;
                    const snipList = (snippets?.listValue?.values) || (Array.isArray(snippets) ? snippets : null);
                    if (Array.isArray(snipList)) {
                        for (const item of snipList) {
                            const itemStruct = item.structValue?.fields || item;
                            const text = getVal(itemStruct, 'snippet') || getVal(itemStruct, 'content');
                            addContent(text);
                        }
                    }
                };
                tryExtract(derived);
                tryExtract(struct);

                // Try to get full content & title from jsonData if available
                let fullContent = contentParts.join('\n\n ... \n\n');

                try {
                    const jsonDataStr = doc?.jsonData;
                    if (jsonDataStr) {
                        const jsonData = JSON.parse(jsonDataStr);
                        if (jsonData.content) {
                            fullContent = jsonData.content;
                        }
                        if (jsonData.title && !jsonTitle) {
                            jsonTitle = jsonData.title;
                        }
                    }
                } catch (e) {
                    // jsonData parsing failed, use snippets
                }

                // 2. Fallback: Check if the extracted content itself is a JSON string
                // (This happens when Vertex AI indexes JSON files as unstructured text)
                if (!jsonTitle) {
                    try {
                        // Attempt to find the largest JSON-like block if mixed with other text
                        // Or just try parsing the cleaned content 
                        const trimmed = fullContent.trim();
                        // Heuristic: It looks like a JSON object containing "title"
                        if (trimmed.startsWith('{') && trimmed.includes('"title"')) {
                            // Handle potential truncated JSON by finding the last closing brace
                            const lastBrace = trimmed.lastIndexOf('}');
                            if (lastBrace > 0) {
                                const potentialJson = trimmed.substring(0, lastBrace + 1);
                                const parsed = JSON.parse(potentialJson);
                                if (parsed.title) {
                                    jsonTitle = parsed.title;
                                    // If we successfully parsed the JSON, showing the raw JSON to the user/LLM is bad.
                                    // Extracted the actual content field if available.
                                    if (parsed.content) {
                                        fullContent = parsed.content;
                                    } else {
                                        // If no content field, remove title/id fields from display text if possible, 
                                        // or just keep it as is.
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // parsing extracted content failed, ignore
                    }
                }

                const title = String(
                    jsonTitle ||
                    getVal(derived, 'title') ||
                    getVal(struct, 'title') ||
                    doc?.id ||
                    'No Title'
                );
                const link = String(
                    getVal(derived, 'link') ||
                    getVal(struct, 'link') ||
                    getVal(derived, 'uri') ||
                    ''
                );
                const trustTier = getVal(struct, 'trust_tier') || getVal(derived, 'trust_tier') || 3;
                const sourceType = getVal(struct, 'source_type') || getVal(derived, 'source_type') || 'official';
                const authorId = getVal(struct, 'author_id') || getVal(derived, 'author_id') || 'Vertex AI';

                // Try to extract UUID from JSON content or GCS file path
                // Knowledge files are stored as gs://bucket/<uuid>.json
                let knowledgeId = '';

                // 1. Try to get ID from parsed JSON content (if available)
                const jsonIdMatch = fullContent.match(/"id"\s*:\s*"([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/i);
                if (jsonIdMatch) {
                    knowledgeId = jsonIdMatch[1];
                }

                // 2. Try to extract UUID from GCS link/uri
                if (!knowledgeId) {
                    const gcsPath = link || getVal(derived, 'uri') || getVal(struct, 'uri') || '';
                    const uuidFromPath = gcsPath.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
                    if (uuidFromPath) {
                        knowledgeId = uuidFromPath[1];
                    }
                }

                // 3. Fallback to original ID
                const finalId = knowledgeId || result.id || doc?.id || '';

                return {
                    id: finalId,
                    title: title,
                    contentSnippet: fullContent || title,
                    url: link,
                    author: authorId,
                    trustTier: Number(trustTier),
                    sourceType: sourceType
                } as Citation;
            });

            return {
                answer: '',
                citations: citations
            };

        } catch (error) {
            console.error('Vertex AI Search error:', error);
            return { answer: '', citations: [] };
        }
    }
}
