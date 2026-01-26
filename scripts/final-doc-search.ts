
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findTheDoc() {
    console.log('Searching all knowledge_base records for "8" and "種類" or "不開示"...');
    const { data, error } = await supabase
        .from('knowledge_base')
        .select('*');

    if (error) {
        console.error(error);
        return;
    }

    const matches = data?.filter(k =>
        (k.content || '').includes('8種類') ||
        (k.content || '').includes('８種類') ||
        (k.title || '').includes('不開示') ||
        (k.content || '').includes('不開示')
    ) || [];

    console.log(`\nFound ${matches.length} matches:`);
    matches.forEach(m => {
        console.log(`- [${m.title}] (ID: ${m.id}) Status: ${m.approval_status}`);
    });

    if (matches.length === 0) {
        console.log('\n!!! THE DOCUMENT IS MISSING FROM SUPABASE !!!');
        console.log('Fetching top 10 documents summary to see what IS there:');
        data?.slice(0, 10).forEach(m => console.log(`  - ${m.title}`));
    }
}

findTheDoc();
