import { searchKnowledge } from '@/lib/knowledge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    // クエリパラメータのバリデーション
    if (!q) {
        return new Response(
            JSON.stringify({ error: "検索キーワード q を指定してください。" }),
            {
                status: 400,
                headers: { "Content-Type": "application/json" }
            }
        );
    }

    // 共通のナレッジ検索関数を使用
    const results = searchKnowledge(q);

    // レスポンス返却
    return new Response(
        JSON.stringify({
            query: q,
            results: results,
        }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" }
        }
    );
}
