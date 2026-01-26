import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ALLOWED_IDS = ['suzuki_01', 'sato_02', 'tanaka_03'];

async function cleanup() {
    console.log('Starting cleanup...');
    const { data: users, error } = await supabase.from('users').select('id, name');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} users.`);

    const toDelete = users.filter(u => !ALLOWED_IDS.includes(u.id));

    if (toDelete.length === 0) {
        console.log('No cleanup needed. Only allowed users exist.');
        return;
    }

    // Map old IDs to new IDs for migration
    const MIGRATION_MAP: Record<string, string> = {
        'suzuki-003': 'suzuki_01',
        'sato-002': 'sato_02',
        'tanaka-001': 'tanaka_03'
    };

    console.log('Users to delete:', toDelete.map(u => `${u.name} (${u.id})`).join(', '));

    for (const u of toDelete) {
        // 1. Migrate Knowledge Ownership
        const newOwnerId = MIGRATION_MAP[u.id];
        if (newOwnerId) {
            console.log(`Migrating knowledge from ${u.id} to ${newOwnerId}...`);
            const { error: updateError } = await supabase
                .from('knowledge_base')
                .update({ created_by: newOwnerId })
                .eq('created_by', u.id);

            if (updateError) {
                console.error(`Failed to migrate knowledge for ${u.id}:`, updateError);
                continue; // Skip deletion if migration fails
            }
        } else {
            console.warn(`No mapping found for ${u.id}, knowledge deletion might fail due to FK constraints.`);
        }

        // 2. Delete User
        const { error: delError } = await supabase.from('users').delete().eq('id', u.id);
        if (delError) {
            console.error(`Failed to delete ${u.id}:`, delError);
        } else {
            console.log(`Deleted user: ${u.name} (${u.id})`);
        }
    }

    console.log('Cleanup complete.');
}

cleanup();
