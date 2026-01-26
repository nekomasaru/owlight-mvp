import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestKnowledge() {
    console.log('Creating test knowledge for sync...');

    const testId = `test-sync-${Date.now()}`;

    // First ensure we have a user
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : 'test-user';

    if (!users || users.length === 0) {
        // Create dummy user if needed
        await supabase.from('users').insert({
            id: userId,
            name: 'Test User',
            role: 'admin'
        });
    }

    const { error } = await supabase.from('knowledge_base').insert({
        title: `Sync Test Knowledge ${new Date().toISOString()}`,
        content: 'This is a test content specifically created to verify the GCS sync script.',
        category: 'test',
        trust_tier: 1, // Gold
        source_type: 'official',
        approval_status: 'approved', // Important: must be approved
        synced_to_vertex: false, // Important: not synced yet
        created_by: userId,
        tags: ['test', 'sync-verification']
    });

    if (error) {
        console.error('Failed to create test data:', error);
    } else {
        console.log('✓ Test data created successfully');
    }
}

createTestKnowledge().catch(console.error);
