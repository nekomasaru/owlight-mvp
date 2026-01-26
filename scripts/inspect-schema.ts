
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
    const { data, error } = await supabase.from('chat_messages').select('*').limit(1);
    if (error) console.error(error);
    else console.log(Object.keys(data[0]));
}

inspect();
