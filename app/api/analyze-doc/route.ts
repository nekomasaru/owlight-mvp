import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Use gemini-1.5-pro for vision/document capabilities
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const filePart = {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType: file.type
            },
        };

        const prompt = `
        あなたはこのファイルを分析するAIアシスタントです。
        このファイルの内容に基づいて、他の社員に助けを求めるための「ナレッジWANTED依頼（募集）」を作成したいです。
        
        以下のJSON形式で出力してください。Markdownコードブロック(tick)は含めないでください。raw JSONのみです。
        {
          "title": "依頼のタイトル（簡潔に）",
          "content": "具体的な依頼内容。何が分からなくて、どのような情報を求めているか。ファイルの内容を要約して状況説明に含めてください。"
        }
        `;

        const result = await model.generateContent([prompt, filePart]);
        const response = result.response;
        const text = response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return NextResponse.json(parsed);
        }

        // Fallback: use text as content
        return NextResponse.json({ title: 'ファイル分析結果', content: text });

    } catch (e: any) {
        console.error('Error analyzing file:', e);
        return NextResponse.json({ error: e.message || 'Analysis failed' }, { status: 500 });
    }
}
