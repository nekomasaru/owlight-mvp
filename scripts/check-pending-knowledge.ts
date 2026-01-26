import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPendingKnowledge() {
    console.log('Checking for pending knowledge submissions...');

    const { data, count, error } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact' })
        .eq('approval_status', 'pending');

    if (error) {
        console.error('Error fetching pending knowledge:', error);
        return;
    }

    console.log(`Found ${count} pending knowledge entries.`);
    if (data && data.length > 0) {
        data.forEach(item => {
            console.log(`- ID: ${item.id}, Title: ${item.title}, CreatedBy: ${item.created_by}, CreatedAt: ${item.created_at}`);
        });
    }

    const { count: totalCount } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true });

    console.log(`Total knowledge entries in DB: ${totalCount}`);
}

checkPendingKnowledge();
