
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findTargetDoc() {
    const targetId = '5432b5fa-c5c4-45f0-a912-7f78e53adc44';
    console.log(`Searching for Record ID: ${targetId}...`);

    const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('id', targetId)
        .single();

    if (error) {
        console.error('Error fetching record:', error.message);
        return;
    }

    if (!data) {
        console.log('Record not found in knowledge_base.');
    } else {
        console.log('\n--- FOUND RECORD ---');
        console.log(`Title: ${data.title}`);
        console.log(`Status: ${data.approval_status}`);
        console.log(`Synced: ${data.synced_to_vertex}`);
        console.log(`Visibility: ${data.visibility}`);
        console.log('Content:\n', data.content);
    }
}

findTargetDoc();
