
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function globalHistory() {
    console.log("Searching history for any message with '8種類'...");
    const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('id, content, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error(error);
        return;
    }

    const matches = messages.filter(m => m.content?.includes('8種類') || m.content?.includes('８種類'));
    console.log(`Found ${matches.length} matches.`);

    matches.forEach(m => {
        console.log(`[${m.created_at}] Role: ${m.role} | Content: ${m.content.substring(0, 100)}...`);
    });
}

globalHistory();
