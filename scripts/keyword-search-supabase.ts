
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function globalSearch() {
    const keywords = ['8種類', '不開示', '種類'];
    console.log(`Searching Supabase for keywords: ${keywords.join(', ')}...`);

    const { data: allDocs, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content, approval_status');

    if (error) {
        console.error(error);
        return;
    }

    const matches = allDocs.filter(doc => {
        const text = (doc.title + ' ' + (doc.content || '')).toLowerCase();
        return keywords.some(k => text.includes(k.toLowerCase()));
    });

    console.log(`Found ${matches.length} matches in Supabase.`);
    matches.forEach(m => {
        console.log(`\n--- Match: ${m.title} [Status: ${m.approval_status}] ---`);
        console.log(`ID: ${m.id}`);
        console.log(`Content Preview: ${m.content?.substring(0, 300)}...`);
    });
}

globalSearch();
