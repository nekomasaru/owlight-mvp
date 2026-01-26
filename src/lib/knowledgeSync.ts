/**
 * OWLight Knowledge Sync Library
 * Provides functions for syncing knowledge to GCS and triggering Vertex AI Search import.
 */

import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';

// Initialize clients lazily
let storage: Storage | null = null;

function getStorage(): Storage {
    if (!storage) {
        const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json';
        storage = new Storage({ keyFilename });
    }
    return storage;
}

/**
 * Sync a single knowledge item to GCS
 */
export async function syncKnowledgeToGCS(knowledge: {
    id: string;
    title: string;
    content: string;
    trust_tier?: number;
    source_type?: string;
    category?: string;
    tags?: string;
    author_id?: string;
    created_at?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const bucketName = process.env.GCP_STORAGE_BUCKET || 'owlight';
        const st = getStorage();
        const bucket = st.bucket(bucketName);

        // Trust tier label
        const tierLabels: { [key: number]: string } = {
            1: 'Gold🥇',
            2: 'Silver🥈',
            3: 'Bronze🥉'
        };
        const tierLabel = tierLabels[knowledge.trust_tier || 3] || 'Bronze🥉';

        // Document structure matching Vertex AI Search expectations
        const doc = {
            id: knowledge.id,
            structData: {
                title: knowledge.title,
                content: knowledge.content,
                trust_tier: knowledge.trust_tier || 3,
                trust_tier_label: tierLabel,
                source_type: knowledge.source_type || 'user_submission',
                category: knowledge.category || 'general',
                tags: knowledge.tags || '',
                author_id: knowledge.author_id || '',
                created_at: knowledge.created_at || new Date().toISOString()
            },
            content: {
                mimeType: 'text/plain',
                uri: '' // Will be populated by Vertex
            }
        };

        // Upload as JSON
        const fileName = `knowledge/${knowledge.id}.json`;
        const file = bucket.file(fileName);
        await file.save(JSON.stringify(doc), {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'no-cache'
            }
        });

        console.log(`[syncKnowledgeToGCS] Uploaded: gs://${bucketName}/${fileName}`);
        return { success: true };

    } catch (error: any) {
        console.error(`[syncKnowledgeToGCS] Error:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Trigger Vertex AI Search to import documents from GCS
 */
export async function triggerVertexImport(): Promise<{ success: boolean; operationName?: string; error?: string }> {
    try {
        const project = process.env.GCP_PROJECT_ID;
        const datastoreId = process.env.GCP_VERTEX_DATASTORE_ID;
        const bucketName = process.env.GCP_STORAGE_BUCKET || 'owlight';

        if (!project || !datastoreId) {
            throw new Error('Missing GCP_PROJECT_ID or GCP_VERTEX_DATASTORE_ID');
        }

        const location = 'global';
        const collection = 'default_collection';
        const gcsUri = `gs://${bucketName}/knowledge/*.json`;

        const auth = new GoogleAuth({
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'service-account.json',
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const accessToken = tokenResponse.token;

        const branchName = `projects/${project}/locations/${location}/collections/${collection}/dataStores/${datastoreId}/branches/0`;
        const endpoint = `https://discoveryengine.googleapis.com/v1beta/${branchName}/documents:import`;

        const body = {
            gcsSource: {
                inputUris: [gcsUri],
                dataSchema: 'content'
            },
            reconciliationMode: 'INCREMENTAL'
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
            const err = await response.text();
            throw new Error(`API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        console.log(`[triggerVertexImport] Import job started: ${data.name}`);
        return { success: true, operationName: data.name };

    } catch (error: any) {
        console.error(`[triggerVertexImport] Error:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Combined function: Sync to GCS then trigger Vertex import
 */
export async function syncAndImport(knowledge: Parameters<typeof syncKnowledgeToGCS>[0]): Promise<{
    gcsSync: { success: boolean; error?: string };
    vertexImport: { success: boolean; operationName?: string; error?: string };
}> {
    const gcsResult = await syncKnowledgeToGCS(knowledge);

    // Only trigger Vertex import if GCS sync succeeded
    let vertexResult: { success: boolean; operationName?: string; error?: string } = { success: false, error: 'GCS sync failed' };
    if (gcsResult.success) {
        vertexResult = await triggerVertexImport();
    }

    return {
        gcsSync: gcsResult,
        vertexImport: vertexResult
    };
}
