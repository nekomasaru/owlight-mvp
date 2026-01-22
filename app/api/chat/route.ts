import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchKnowledge } from "@/lib/knowledge";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// In-memory rate limiter
const requestsMap = new Map<string, number[]>();

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        const now = Date.now();
        const windowMs = 60_000;
        const limit = 5;

        const timestamps = (requestsMap.get(ip) ?? []).filter(
            (t) => now - t < windowMs
        );

        if (timestamps.length >= limit) {
            return new Response(
                JSON.stringify({
                    error: "短時間にアクセスが集中しています。しばらく時間をおいて再度お試しください。",
                }),
                {
                    status: 429,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }
        timestamps.push(now);
        requestsMap.set(ip, timestamps);

        // 2. Parse Request
        const { messages } = await req.json() as {
            messages: { role: "user" | "assistant"; content: string }[];
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid messages format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        const userQuery = lastUserMessage ? lastUserMessage.content : "";
        const userInputLength = userQuery.length;

        // Logging variables
        const start = Date.now();
        const modelName = "gemini-2.0-flash";
        let responseText = "";
        let success = false;
        let errorMessage: string | null = null;
        let ragHitCount = 0;

        try {
            // --- RAG: Knowledge Search ---
            const relatedDocs = searchKnowledge(userQuery);
            ragHitCount = relatedDocs.length;

            // 3. Configure Model
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    maxOutputTokens: 512,
                    temperature: 0.2, // RAGでは正確性を高めるため低めのtemperatureを推奨
                }
            });

            // 4. Transform messages for Gemini & Inject Context
            // システムプロンプト相当の役割をトップに追加
            const contextText = relatedDocs.length > 0
                ? `以下の情報を参考資料として、ユーザーの質問に日本語で答えてください。
資料に見当たらない内容は「提供された資料には記載がありません」とはっきり答えてください。

【参考資料】
${relatedDocs.map(d => `■${d.title}\n${d.content}`).join("\n\n")}`
                : "あなたは自治体の有能なアシスタントです。質問に対し事実に基づいて丁寧に回答してください。";

            const contents = messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));

            // 会話の文脈を崩さないよう、最新のユーザーメッセージの前にコンテキストを挿入するか、
            // あるいはGeminiの「System Instruction」機能を使いたいが、
            // 簡易実装として「最初のユーザーメッセージの前」または「メッセージリストの最初」に
            // コンテキスト情報を付加する。
            // ここではメッセージリストの最初に「システム指示」的なメッセージを仮想的に追加する。
            contents.unshift({
                role: "user",
                parts: [{ text: `System Instruction: ${contextText}\n\nこれ以降、この指示に従って会話を続けてください。ユーザーの最初のメッセージは次から始まります。` }]
            });

            // 5. Generate Content
            const result = await model.generateContent({
                contents,
            });

            const response = await result.response;
            responseText = response.text();
            success = true;

            return new Response(JSON.stringify({ reply: responseText }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } catch (llmError) {
            success = false;
            errorMessage = llmError instanceof Error ? llmError.message : String(llmError);
            console.error("Gemini API Error:", llmError);
            return new Response(JSON.stringify({ error: "Failed to generate content" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        } finally {
            const durationMs = Date.now() - start;
            const logObject = {
                timestamp: new Date().toISOString(),
                route: "/api/chat",
                model: modelName,
                userInputLength,
                responseLength: responseText.length,
                durationMs,
                success,
                errorMessage,
                ragHitCount // ログにRAGヒット数を追加
            };
            console.log("[LLM_LOG]", JSON.stringify(logObject));
        }

    } catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
