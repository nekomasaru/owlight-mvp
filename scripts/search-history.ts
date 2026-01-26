
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findHistory() {
    console.log("Searching history for '8種類'...");

    // Fetch recent messages
    const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, content, citations, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    const matches = messages.filter(m => m.content?.includes('8種類'));
    console.log(`Found ${matches.length} messages mentioning '8種類'.`);

    matches.forEach((m, i) => {
        console.log(`\n--- Match ${i + 1} [${m.created_at}] ---`);
        console.log(`Role: ${m.role}`);
        console.log(`Content Snippet: ${m.content.substring(0, 200)}...`);
        console.log(`Citations Count: ${m.citations?.length || 0}`);
        if (m.citations && m.citations.length > 0) {
            console.log(`First Citation ID: ${m.citations[0].id}`);
            console.log(`First Citation Text Snippet: ${m.citations[0].text?.substring(0, 100)}`);
        }
    });
}

findHistory();
