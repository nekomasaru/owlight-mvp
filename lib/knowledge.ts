// 検索対象のナレッジデータ
export const knowledgeDocs = [
    {
        id: "1",
        title: "庁内DXの進め方",
        keywords: ["dx", "庁内dx", "デジタルトランスフォーメーション", "進め方"],
        content: "庁内DXを進めるための基本方針と進め方の手順をまとめたドキュメントです。主なステップ：1.現状分析、2.目標設定、3.システム選定、4.職員トレーニング。",
    },
    {
        id: "2",
        title: "生成AI活用ガイドライン",
        keywords: ["生成ai", "ai", "ガイドライン", "chatgpt", "gemini"],
        content: "自治体における生成AI活用の留意点とガイドラインです。機密情報の入力禁止、成果物の人間による確認、著作権への配慮が重要事項として記載されています。",
    },
    {
        id: "3",
        title: "情報セキュリティポリシー",
        keywords: ["セキュリティ", "ポリシー", "パスワード", "メール", "不審メール", "情報漏洩"],
        content: "職員が守るべき情報セキュリティポリシーの概要。パスワードの定期変更、不審なメールの通報窓口（内線555）、PCの持ち出し制限について規定されています。",
    },
];

/**
 * キーワードによる簡易検索関数
 */
export function searchKnowledge(query: string, limit = 3) {
    const lowerQ = query.toLowerCase();

    return knowledgeDocs
        .filter((doc) => {
            // 1. キーワードのいずれかがクエリに含まれているか（文章での質問に強い）
            const keywordMatch = doc.keywords.some(k => lowerQ.includes(k.toLowerCase()));

            // 2. タイトルまたはコンテンツにクエリが含まれている（単語検索に強い）
            const docMatch = doc.title.toLowerCase().includes(lowerQ) ||
                doc.content.toLowerCase().includes(lowerQ);

            return keywordMatch || docMatch;
        })
        .slice(0, limit)
        .map((doc) => ({
            ...doc,
            score: 1,
        }));
}
