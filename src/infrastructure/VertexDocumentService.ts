/**
 * VertexDocumentService
 * Provides direct CRUD operations on Vertex AI Search documents.
 * Uses the documents.create API for immediate indexing without GCS.
 */

import { DocumentServiceClient, protos } from '@google-cloud/discoveryengine';

type IDocument = protos.google.cloud.discoveryengine.v1.IDocument;

export interface VertexDocument {
    id: string;
    title: string;
    content: string;
    trust_tier?: number;
    trust_tier_label?: string;
    source_type?: string;
    category?: string;
    visibility?: string;
    department_id?: string;
    author_id?: string;
    contributors?: string;
    law_reference?: string;
    law_reference_url?: string;
    tags?: string;
    helpfulness_count?: number;
    created_at?: string;
    updated_at?: string;
    structured_data?: any;
}

export class VertexDocumentService {
    private client: DocumentServiceClient;
    private parent: string;

    constructor() {
        this.client = new DocumentServiceClient();

        const projectId = process.env.GCP_PROJECT_ID || '';
        const location = process.env.VERTEX_LOCATION || 'global';
        const dataStoreId = process.env.VERTEX_DATA_STORE_ID || process.env.GCP_VERTEX_DATASTORE_ID || '';

        if (!projectId || !dataStoreId) {
            console.warn('VertexDocumentService: Missing GCP_PROJECT_ID or VERTEX_DATA_STORE_ID');
        }

        // Parent path for document operations
        this.parent = `projects/${projectId}/locations/${location}/dataStores/${dataStoreId}/branches/default_branch`;
    }

    /**
     * Create a new document in Vertex AI Search.
     * This immediately adds the document to the data store for indexing.
     */
    async createDocument(doc: VertexDocument): Promise<void> {
        const documentData: IDocument = {
            id: doc.id,
            jsonData: JSON.stringify({
                id: doc.id,
                title: doc.title,
                content: doc.content,
                trust_tier: doc.trust_tier,
                trust_tier_label: doc.trust_tier_label || this.getTrustTierLabel(doc.trust_tier),
                source_type: doc.source_type,
                category: doc.category || 'general',
                visibility: doc.visibility,
                department_id: doc.department_id,
                author_id: doc.author_id,
                contributors: doc.contributors,
                law_reference: doc.law_reference,
                law_reference_url: doc.law_reference_url,
                tags: doc.tags,
                helpfulness_count: doc.helpfulness_count,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                structured_data: doc.structured_data
            })
        };

        try {
            console.log(`[VertexDocumentService] Creating document ${doc.id}...`);
            await this.client.createDocument({
                parent: this.parent,
                documentId: doc.id,
                document: documentData
            });
            console.log(`[VertexDocumentService] Document ${doc.id} created successfully.`);
        } catch (error: any) {
            // If document already exists, update it instead
            if (error.code === 6) { // ALREADY_EXISTS
                console.log(`[VertexDocumentService] Document ${doc.id} exists, updating...`);
                await this.updateDocument(doc);
            } else {
                console.error(`[VertexDocumentService] Failed to create document ${doc.id}:`, error.message);
                throw error;
            }
        }
    }

    /**
     * Update an existing document in Vertex AI Search.
     */
    async updateDocument(doc: VertexDocument): Promise<void> {
        const documentData: IDocument = {
            name: `${this.parent}/documents/${doc.id}`,
            jsonData: JSON.stringify({
                id: doc.id,
                title: doc.title,
                content: doc.content,
                trust_tier: doc.trust_tier,
                trust_tier_label: doc.trust_tier_label || this.getTrustTierLabel(doc.trust_tier),
                source_type: doc.source_type,
                category: doc.category || 'general',
                visibility: doc.visibility,
                department_id: doc.department_id,
                author_id: doc.author_id,
                contributors: doc.contributors,
                law_reference: doc.law_reference,
                law_reference_url: doc.law_reference_url,
                tags: doc.tags,
                helpfulness_count: doc.helpfulness_count,
                created_at: doc.created_at,
                updated_at: doc.updated_at || new Date().toISOString(),
                structured_data: doc.structured_data
            })
        };

        try {
            await this.client.updateDocument({
                document: documentData,
                allowMissing: true
            });
            console.log(`[VertexDocumentService] Document ${doc.id} updated successfully.`);
        } catch (error: any) {
            console.error(`[VertexDocumentService] Failed to update document ${doc.id}:`, error.message);
            throw error;
        }
    }

    /**
     * Delete a document from Vertex AI Search.
     */
    async deleteDocument(documentId: string): Promise<void> {
        const name = `${this.parent}/documents/${documentId}`;

        try {
            await this.client.deleteDocument({ name });
            console.log(`[VertexDocumentService] Document ${documentId} deleted successfully.`);
        } catch (error: any) {
            if (error.code === 5) { // NOT_FOUND
                console.log(`[VertexDocumentService] Document ${documentId} not found, skipping delete.`);
            } else {
                console.error(`[VertexDocumentService] Failed to delete document ${documentId}:`, error.message);
                throw error;
            }
        }
    }

    private getTrustTierLabel(tier?: number): string {
        switch (tier) {
            case 1: return 'Gold🥇';
            case 2: return 'Silver🥈';
            case 3: return 'Bronze🥉';
            default: return 'Unknown';
        }
    }
}
