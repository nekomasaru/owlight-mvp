
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

console.log('Loading env from:', envPath);
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSupabaseSearch() {
                .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(10);

    if (error2) throw error2;
    logResults(data2 || []);
} else {
    logResults(data || []);
}

// Also check Top Knowledge (Static content)
console.log('\n--- Checking Top Knowledge (Disabled Feature) ---');
const { data: topData, error: topError } = await supabase
    .from('knowledge_base')
    .select('*')
    .order('helpfulness_count', { ascending: false })
    .limit(5);

if (topError) throw topError;
if (topData) {
    topData.forEach(r => {
        console.log(`\n[Top] [${r.title}]`);
        if ((r.content || '').includes('不開示')) console.log('*** CONTAINS KEYWORD ***');
        console.log((r.content || '').substring(0, 100));
    });
}

    } catch (error) {
    console.error('Error:', error);
}
}

function logResults(results: any[]) {
    console.log(`Found ${results.length} results.`);
    results.forEach(r => {
        console.log(`\n[${r.title}]`);
        console.log((r.content || '').substring(0, 200));
    });
}

testSupabaseSearch();
