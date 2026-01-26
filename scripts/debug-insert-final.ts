import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debugInsert() {
    const dbRecord = {
        title: 'Debug Title',
        content: 'Debug Content ' + new Date().toISOString(),
        category: 'Debug',
        trust_tier: 3,
        source_type: 'user_submission',
        visibility: 'public',
        approval_status: 'pending',
        helpfulness_count: 0,
        tags: ['debug']
    };

    console.log('Inserting into knowledge_base...');
    const { data, error } = await supabase
        .from('knowledge_base')
        .insert(dbRecord)
        .select('id')
        .single();

    if (error) {
        console.error('Insert failed:');
        console.error(error);
        if (error.details) console.error('Details:', error.details);
        if (error.hint) console.error('Hint:', error.hint);
        if (error.message) console.error('Message:', error.message);
    } else {
        console.log('Insert succeeded! ID:', data.id);
    }
}

debugInsert();
