
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findHistory() {
    console.log("Searching history for Assistant messages with '8種類'...");

    // Fetch recent assistant messages
    const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, content, citations, role, created_at')
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error(error);
        return;
    }

    const matches = messages.filter(m => m.content?.includes('8種類'));
    console.log(`Found ${matches.length} assistant messages mentioning '8種類'.`);

    matches.forEach((m, i) => {
        console.log(`\n=== Match ${i + 1} [${m.created_at}] ===`);
        console.log(`Content:\n${m.content}\n`);
        console.log(`Citations:`, JSON.stringify(m.citations, null, 2));
    });
}

findHistory();
