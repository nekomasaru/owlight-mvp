
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findTheOne() {
    console.log("Searching history for Assistant messages containing the 8 reasons...");

    const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, content, citations, session_id, role, created_at')
        .ilike('content', '%個人情報%') // These are common to the 8 reasons
        .ilike('content', '%法人%')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${messages.length} assistant candidates.`);

    messages.forEach((m, i) => {
        if (m.content.includes('8種類') || m.content.includes('８種類')) {
            console.log(`\n=== SUCCESS MATCH FOUND ===`);
            console.log(`Date: ${m.created_at}`);
            console.log(`Conversation ID: ${m.conversation_id}`);
            console.log(`Content:\n${m.content}\n`);
            console.log(`Citations:`, JSON.stringify(m.citations, null, 2));
        }
    });
}

findTheOne();
