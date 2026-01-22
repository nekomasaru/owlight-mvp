import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Uploaded File URI (managed manually for MVP)
// 庁内DXガイドラインv1
const MANUAL_FILE_URI = "https://generativelanguage.googleapis.com/v1beta/files/tgzv6jannnt7";

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
        const userInputLength = lastUserMessage ? lastUserMessage.content.length : 0;

        // Logging variables
        const start = Date.now();
        const modelName = "gemini-2.0-flash";
        let responseText = "";
        let success = false;
        let errorMessage: string | null = null;

        try {
            // 3. Configure Model
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    maxOutputTokens: 1024, // ドキュメント参照のため少し長めに確保
                    temperature: 0.2,      // 事実に基づく回答のため低めに
                }
            });

            // 4. Construct Contents with File API
            // 会話の最初に、「ファイルを参照せよ」という指示と共に File Data を渡す
            const systemPart = {
                text: "あなたは自治体の有能なアシスタントです。添付の「庁内DXガイドライン」およびその他の資料に基づいて、ユーザーの質問に日本語で丁寧に回答してください。資料にない情報については推測せず、「資料には記載がありません」と答えてください。"
            };

            const filePart = {
                fileData: {
                    mimeType: "text/plain",
                    fileUri: MANUAL_FILE_URI
                }
            };

            // 最初のメッセージ（システム指示相当）
            const systemMessage = {
                role: "user",
                parts: [filePart, systemPart]
            };

            // ユーザーの会話履歴
            const historyContents = messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));

            // 結合
            const contents = [systemMessage, ...historyContents];

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
                ragType: "google-file-api" // RAGの種類をログに記録
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
