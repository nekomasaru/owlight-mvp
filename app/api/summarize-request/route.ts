import { NextResponse } from 'next/server';
import { container } from '@/src/di/container';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
        }

        // Extract last few messages for context
        const contextMessages = messages.slice(-6); // Last 3 turns
        const conversationText = contextMessages.map((m: any) => `${m.role}: ${m.content}`).join('\n');

        const prompt = `
あなたは、組織内のナレッジ共有を促進するアシスタントです。
以下のチャット履歴は、ユーザーが何らかの業務上の課題解決を試みたものの、AIでは完全に解決できなかったやり取りです。
このユーザーが、組織内の「詳しい人」に向けて助けを求めるための「依頼文」を作成してください。

チャット履歴:
${conversationText}

以下のJSON形式で出力してください。Markdownは含めないでください。
{
  "title": "30文字以内の簡潔で具体的な件名（例：〇〇の手続きについて教えてください）",
  "content": "200文字程度の詳細な依頼文。状況と、具体的に何を知りたいかを丁寧に説明する文章。"
}
`;

        // Use LLM Service from DI
        const llmService = container.llmService;
        const responseText = await llmService.generateCompletion(prompt);

        // Simple JSON cleanup if needed (Gemini sometimes adds markdown blocks)
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error generating summary:', error);
        return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }
}
