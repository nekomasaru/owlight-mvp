
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function restoreKnowledge() {
    console.log("Restoring '8 Types of Non-disclosure' knowledge record...");

    const content = `
情報公開法および多くの自治体の情報公開条例では、不開示情報は原則として以下の「8種類」に分類されます。

1. 個人情報：特定の個人を識別できる情報（氏名、生年月日、住所等）や、公にすることで個人の権利利益を害するおそれがあるもの。
2. 法人等情報：企業や団体の正当な利益（営業秘密や経営戦略）を害するおそれがあるもの。
3. 国の安全等に関する情報：外交、防衛、他国との信頼関係に関わる情報。
4. 犯罪の予防等に関する情報：捜査、警備、刑罰の執行を妨げるおそれがあるもの。
5. 審議検討情報：行政機関内部の意思決定過程にある情報で、中立性や公正性を損なうおそれがあるもの。
6. 行政運営情報：監査、検査、交渉、試験などの事務執行に著しい支障を及ぼすおそれがあるもの。
7. 公共の利益を害する情報：人の生命や公共の安全の維持に支障を及ぼすおそれがあるもの。
8. 法令秘情報：他の法律や条例で公開が禁止されているもの。

これらの項目は、マニュアルや条例の第5条〜第7条付近に列挙されており、実務上はこれら8つのいずれかに該当するかを一点一点審査します。
`;

    const { data, error } = await supabase
        .from('knowledge_base')
        .insert([
            {
                title: '不開示情報の8つの種類（解説）',
                content: content,
                category: '情報公開',
                approval_status: 'approved',
                trust_tier: 1,
                source_type: 'official'
            }
        ])
        .select();

    if (error) {
        console.error("Restore failed:", error);
    } else {
        console.log("Successfully restored knowledge record:", data[0].id);
        // Also run sync to GCS so Vertex picks it up (though Supabase direct lookup is what we want for full-page)
    }
}

restoreKnowledge();
