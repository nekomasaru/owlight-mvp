/**
 * Knowledge Sync Script
 * Exports approved knowledge from Supabase to GCS for Vertex AI Search indexing
 * 
 * Usage: npx tsx scripts/sync-knowledge-to-gcs.ts
 * Recommended: Run every 5 minutes via cron or Cloud Scheduler
 */

import { createClient } from '@supabase/supabase-js';
import { Storage } from '@google-cloud/storage';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GCS client
const storage = new Storage({
    keyFilename: path.join(process.cwd(), 'gcp-key.json')
});
const bucketName = process.env.GCP_STORAGE_BUCKET || 'owlight';
const bucket = storage.bucket(bucketName);

interface KnowledgeRecord {
    id: string;
    title: string;
    content: string;
    category: string | null;
    trust_tier: number;
    source_type: string;
    visibility: string;
    department_id: string | null;
    law_reference: string | null;
    law_reference_url: string | null;
    created_by: string | null;
    contributors: string[] | null;
    approval_status: string;
    helpfulness_count: number;
    tags: string[] | null;
    structured_data: any;
    synced_to_vertex: boolean;
    created_at: string;
    updated_at: string;
}

function getTrustTierLabel(tier: number): string {
    switch (tier) {
        case 1: return 'Gold🥇';
        case 2: return 'Silver🥈';
        case 3: return 'Bronze🥉';
        default: return 'Unknown';
    }
}

async function syncKnowledgeToGCS(): Promise<void> {
    console.log('='.repeat(60));
    console.log('OWLight Knowledge Sync to GCS');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Bucket: ${bucketName}`);
    console.log('');

    try {
        // Fetch approved knowledge that needs syncing
        const { data: knowledge, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('approval_status', 'approved')
            .or('synced_to_vertex.is.null,synced_to_vertex.eq.false');

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        if (!knowledge || knowledge.length === 0) {
            console.log('✓ No new knowledge to sync');
            return;
        }

        console.log(`Found ${knowledge.length} knowledge item(s) to sync\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const item of knowledge as KnowledgeRecord[]) {
            try {
                // Create document with metadata for Vertex AI Search
                const doc = {
                    // Required fields
                    id: item.id,
                    title: item.title,
                    content: item.content,

                    // Metadata for search/filtering
                    trust_tier: item.trust_tier,
                    trust_tier_label: getTrustTierLabel(item.trust_tier),
                    source_type: item.source_type,
                    category: item.category || 'general',
                    visibility: item.visibility,
                    department_id: item.department_id,

                    // Attribution
                    author_id: item.created_by,
                    contributors: item.contributors?.join(', ') || '',

                    // Legal references
                    law_reference: item.law_reference,
                    law_reference_url: item.law_reference_url,

                    // Tags for search
                    tags: item.tags?.join(', ') || '',

                    // Metrics
                    helpfulness_count: item.helpfulness_count,

                    // Timestamps
                    created_at: item.created_at,
                    updated_at: item.updated_at,

                    // Structured data (if any)
                    structured_data: item.structured_data
                };

                // Upload to GCS
                const filename = `knowledge/${item.id}.json`;
                const file = bucket.file(filename);

                await file.save(JSON.stringify(doc, null, 2), {
                    contentType: 'application/json',
                    metadata: {
                        // Custom metadata for Vertex AI
                        trust_tier: String(item.trust_tier),
                        category: item.category || 'general',
                        source_type: item.source_type
                    }
                });

                // Mark as synced in Supabase
                const { error: updateError } = await supabase
                    .from('knowledge_base')
                    .update({
                        synced_to_vertex: true,
                        synced_at: new Date().toISOString()
                    })
                    .eq('id', item.id);

                if (updateError) {
                    console.error(`  ✗ Failed to mark as synced: ${item.title}`);
                    console.error(`    Error: ${updateError.message}`);
                    errorCount++;
                } else {
                    console.log(`  ✓ ${getTrustTierLabel(item.trust_tier)} ${item.title}`);
                    successCount++;
                }

            } catch (itemError) {
                console.error(`  ✗ Failed to sync: ${item.title}`);
                console.error(`    Error: ${itemError}`);
                errorCount++;
            }
        }

        console.log('');
        console.log('-'.repeat(40));
        console.log(`Sync Complete: ${successCount} success, ${errorCount} failed`);

    } catch (error) {
        console.error('Sync failed:', error);
        process.exit(1);
    }
}

// Also sync deleted/deprecated knowledge (remove from GCS)
async function cleanupDeprecatedKnowledge(): Promise<void> {
    try {
        // Get deprecated knowledge IDs
        const { data: deprecated } = await supabase
            .from('knowledge_base')
            .select('id')
            .not('deprecated_at', 'is', null);

        if (!deprecated || deprecated.length === 0) {
            return;
        }

        console.log(`\nCleaning up ${deprecated.length} deprecated item(s)...`);

        for (const item of deprecated) {
            try {
                const filename = `knowledge/${item.id}.json`;
                await bucket.file(filename).delete({ ignoreNotFound: true });
                console.log(`  ✓ Removed: ${item.id}`);
            } catch (e) {
                // Ignore deletion errors
            }
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Main execution
async function main(): Promise<void> {
    await syncKnowledgeToGCS();
    await cleanupDeprecatedKnowledge();
    console.log('\nDone!');
}

main().catch(console.error);
