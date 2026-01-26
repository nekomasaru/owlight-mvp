
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listAll() {
    console.log('Fetching all knowledge records...');
    const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title, approval_status');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Total records: ${data.length}`);
    data.forEach(r => {
        console.log(`ID: ${r.id} | Title: ${r.title} | Status: ${r.approval_status}`);
    });
}

listAll();
