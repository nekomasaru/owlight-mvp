
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findLegacyIds() {
    const ids = ['c310c93ffd1e1609d5f8b462ef47046a', '20852af90c9986c97f4e0315f0b018a6'];
    console.log(`Searching for IDs in knowledge_base (as string match)...`);

    // Check if they are IDs (though they aren't UUIDs, some tables might have text IDs)
    // Or check if they are in 'title' or 'content' (unlikely)
    // Or check if they are in 'structured_data' (possible migration artifact)

    const { data: allDocs } = await supabase.from('knowledge_base').select('id, title, structured_data');

    const matches = allDocs?.filter(d =>
        ids.includes(String(d.id)) ||
        ids.includes(d.title) ||
        JSON.stringify(d.structured_data || {}).includes(ids[0]) ||
        JSON.stringify(d.structured_data || {}).includes(ids[1])
    ) || [];

    console.log(`Found ${matches.length} matches in Supabase.`);
    matches.forEach(m => console.log(`[${m.title}] ID: ${m.id}`));
}

findLegacyIds();
