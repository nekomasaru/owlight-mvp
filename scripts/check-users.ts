import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUsers() {
    console.log('Checking users table...');
    const { data, error } = await supabase.from('users').select('id, name');
    if (error) {
        console.error('Error fetching users:', error);
    } else {
        console.log('Users in DB:');
        data.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}`));
    }
}

checkUsers();
