import { NextResponse } from 'next/server';

// 検索対象の簡易データ（ストア）
// 将来的にはデータベースやベクトルストアに置き換えられる想定
const docs = [
    {
        id: "1",
        title: "庁内DXの進め方",
        content: "庁内DXを進めるための基本方針と進め方の手順をまとめたドキュメントです。",
    },
    {
        id: "2",
        title: "生成AI活用ガイドライン",
        content: "自治体における生成AI活用の留意点とガイドラインを整理しています。",
    },
    {
        id: "3",
        title: "情報セキュリティポリシー",
        content: "職員が守るべき情報セキュリティポリシーの概要です。",
    },
];

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

    // --- 検索ロジック ---
    // [Expansion Point]
    // 将来ここにベクトル検索 (Vector Search) や Gemini File Search API へのリクエスト処理を差し込む予定。
    // 現在は簡易的なインメモリ配列からのキーワード部分一致検索を行う。

    const lowerQ = q.toLowerCase();

    const results = docs
        .filter((doc) => {
            // タイトルまたはコンテンツにキーワードが含まれているか判定
            return (
                doc.title.toLowerCase().includes(lowerQ) ||
                doc.content.toLowerCase().includes(lowerQ)
            );
        })
        .slice(0, 3) // 上位3件に制限
        .map((doc) => ({
            ...doc,
            score: 1, // 現在は固定値。ベクトル検索導入時に類似度スコアなどに置き換える
        }));

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
