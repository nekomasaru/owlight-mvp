
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use Service Role to bypass RLS
);

async function checkDocStatus() {
    console.log('Listing top 20 approved documents...');

    // List top 20 documents to inspect titles
    const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content')
        .eq('approval_status', 'approved')
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${data.length} approved documents.`);
    data.forEach(m => {
        console.log(`[${m.title}] (ID: ${m.id})`);
        // Check content for "8" or "種類"
        if ((m.content || '').includes('8')) console.log('  -> Contains "8"');
        if ((m.content || '').includes('種類')) console.log('  -> Contains "種類"');
        if ((m.content || '').includes('不開示')) console.log('  -> Contains "不開示"');
    });
}

checkDocStatus();
