
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPath = path.join(__dirname, '../.env.local');
dotenv.config({ path: envPath });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findAnswerDoc() {
    console.log('Scanning Knowledge Base for "8種類" or "不開示"...');

    // Fetch all approved knowledge (or a large batch)
    const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('approval_status', 'approved')
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data) {
        console.log('No data found.');
        return;
    }

    console.log(`Scanned ${data.length} documents.`);

    // Manual client-side filter to find the "8 types" answer
    const matches = data.filter(d =>
        (d.content && (d.content.includes('8種類') || d.content.includes('８種類'))) ||
        (d.title && d.title.includes('不開示'))
    );

    console.log(`\nFound ${matches.length} potential matches:\n`);

    matches.forEach(d => {
        console.log(`[ID: ${d.id}] Title: ${d.title}`);
        console.log(`Helpfulness: ${d.helpfulness_count}`);
        console.log(`Content Preview: ${d.content.substring(0, 100).replace(/\n/g, ' ')}...`);
        console.log('-------------------------------------------');
    });

    // Also test the keyword extraction logic locally
    const userQuery = "情報公開における不開示理由の種類は何種類ありますか？";
    const extractKeyword = (q: string): string => {
        if (q.length < 10) return q;
        const tokens = q.split(/([はがののをにへともでからより]|における|について|に関?して)/);
        const candidates = tokens.filter(t => t.length >= 2 && !/^[はがののをにへともでからより]/.test(t));
        return candidates.sort((a, b) => b.length - a.length)[0] || q;
    };

    const extracted = extractKeyword(userQuery);
    console.log(`\nLocal Keyword Extraction Test:`);
    console.log(`Query: "${userQuery}"`);
    console.log(`Extracted: "${extracted}"`);

    // Test if this Extracted Keyword would hit the matches
    matches.forEach(d => {
        const hit = d.title.includes(extracted) || d.content.includes(extracted);
        console.log(`Match with "${extracted}": ${hit ? 'YES' : 'NO'}`);
    });
}

findAnswerDoc();
