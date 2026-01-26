import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPolicies() {
    console.log('Checking RLS policies for knowledge_base...');
    const { data, error } = await supabase.rpc('get_policies_for_table', { table_name_input: 'knowledge_base' });

    // If rpc doesn't exist, try querying pg_policies
    if (error) {
        console.log('RPC failed, trying pg_policies directly...');
        const { data: policies, error: pgError } = await supabase.from('pg_policies').select('*').eq('tablename', 'knowledge_base');
        if (pgError) {
            // Probably can't access pg_policies directly via anon/service role without extra permissions
            // Let's try a different approach: check if we can select pending records with service role vs anon
            console.error('Could not fetch policies:', pgError);
        } else {
            console.log('Policies:', policies);
        }
    } else {
        console.log('Policies:', data);
    }
}

async function testVisibility() {
    // 1. Insert a pending record with SERVICE_ROLE
    const { data: inserted, error: insError } = await supabase
        .from('knowledge_base')
        .insert({
            title: 'Visibility Test',
            content: 'Testing visibility of pending records',
            approval_status: 'pending'
        })
        .select()
        .single();

    if (insError) {
        console.error('Insert failed:', insError);
        return;
    }
    const id = inserted.id;
    console.log('Inserted pending record with ID:', id);

    // 2. Try to select it with ANON_KEY
    const anonSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: anonData, error: anonError } = await anonSupabase
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .single();

    if (anonError) {
        console.log('ANON_KEY cannot select pending record:', anonError.message);
    } else {
        console.log('ANON_KEY CAN select pending record.');
    }

    // Cleanup
    await supabase.from('knowledge_base').delete().eq('id', id);
}

testVisibility();
