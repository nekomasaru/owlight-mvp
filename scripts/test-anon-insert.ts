import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonInsert() {
    console.log('Testing insert with ANON_KEY...');
    const { data, error } = await supabase
        .from('knowledge_base')
        .insert({
            title: 'Anon Test',
            content: 'Testing if anon can insert',
            approval_status: 'pending'
        })
        .select();

    if (error) {
        console.error('Insert failed with ANON_KEY:', error);
    } else {
        console.log('Insert succeeded with ANON_KEY:', data);
    }
}

testAnonInsert();
