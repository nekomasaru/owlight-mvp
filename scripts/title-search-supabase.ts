
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function titleSearch() {
    const titles = ['情報公開条例解釈・運用の手引', '個人情報保護制度の手引'];
    console.log(`Searching Supabase for titles: ${titles.join(', ')}...`);

    const { data: allDocs, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content');

    if (error) {
        console.error(error);
        return;
    }

    const matches = allDocs.filter(doc => {
        return titles.some(t => doc.title.includes(t));
    });

    console.log(`Found ${matches.length} matches in Supabase.`);
    matches.forEach(m => {
        console.log(`\n--- Match: ${m.title} ---`);
        console.log(`ID: ${m.id}`);
        console.log(`Content Size: ${m.content?.length || 0}`);
    });
}

titleSearch();
