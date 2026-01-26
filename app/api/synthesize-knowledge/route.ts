import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/synthesize-knowledge - Synthesize knowledge from conversation
export async function POST(req: NextRequest) {
    try {
        const { userMessage, aiResponse } = await req.json();

        if (!userMessage && !aiResponse) {
            return NextResponse.json({ error: 'No content to synthesize' }, { status: 400 });
        }

        // Use existing LLM service from DI container
        const llmService = container.llmService;

        const contentToDistill = `
【ユーザーの質問/発言】
${userMessage || '(なし)'}

【AIの回答】
${aiResponse || '(なし)'}`;

        const instructions = `
以下の会話から、**ユーザーが語っている新しい知見**や、有用な情報を抽出してJSON形式で出力してください。

重要なルール:
- **最優先**: ユーザーが「〜って知ってる？」「実は〜なんだ」のように知識を提供している場合、その内容を要約してcontentにしてください。（AIが「分かりません」と回答していても、ユーザーの発言を正として抽出すること）
- AIが有用な回答をしている場合は、その要点を抽出してください。
- タイトルは具体的かつ検索しやすいものに（例: 「法人番号の付番対象について」）
- 以下のJSON形式のみを出力してください（マークダウンや挨拶は厳禁）:

{
  "title": "簡潔なタイトル",
  "content": "知見の要約（200文字程度）",
  "tags": ["タグ1", "タグ2"]
}`;

        const text = await llmService.distill(contentToDistill, instructions);

        // Parse JSON from response
        try {
            // Extract JSON from response (handle markdown code blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return NextResponse.json({
                    title: parsed.title || '',
                    content: parsed.content || '',
                    tags: Array.isArray(parsed.tags) ? parsed.tags : []
                });
            }
        } catch (parseError) {
            console.error('Failed to parse synthesis response:', parseError);
        }

        // Fallback if parsing fails
        return NextResponse.json({
            title: '',
            content: '',
            tags: []
        });

    } catch (error: any) {
        console.error('Knowledge synthesis error:', error);
        return NextResponse.json({
            error: 'Synthesis failed',
            details: error.message
        }, { status: 500 });
    }
}
