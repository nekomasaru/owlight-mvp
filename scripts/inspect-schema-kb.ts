import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
    const { data, error } = await supabase.from('knowledge_base').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Columns in knowledge_base:', Object.keys(data[0]));
    } else {
        console.log('No data in knowledge_base to inspect columns.');
        // Try to get columns from information_schema if possible, or just insert a dummy and delete it
    }
}

inspect();
