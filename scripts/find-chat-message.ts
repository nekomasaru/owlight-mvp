
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findChatMessage() {
    const targetId = '5432b5fa-c5c4-45f0-a912-7f78e53adc44';
    console.log(`Searching for Chat Message ID: ${targetId}...`);

    const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', targetId)
        .single();

    if (error) {
        console.error('Error fetching message:', error.message);
        return;
    }

    if (!data) {
        console.log('Message not found in chat_messages.');
    } else {
        console.log('\n--- FOUND CHAT MESSAGE ---');
        console.log(`Role: ${data.role}`);
        console.log(`Created At: ${data.created_at}`);
        console.log(`Session ID: ${data.session_id}`);
        console.log('\nContent:\n', data.content);

        if (data.citations) {
            console.log('\nCitations associated with this message:');
            console.log(JSON.stringify(data.citations, null, 2));
        }
    }
}

findChatMessage();
