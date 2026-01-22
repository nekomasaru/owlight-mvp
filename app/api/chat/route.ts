import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// モデルは gemini-2.5-flash（thinking は未使用）
const modelName = "gemini-2.5-flash";

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
        let responseText = "";
        let success = false;
        let errorMessage: string | null = null;
        let fileUrisLog = [];

        try {
            // 3. Configure Model
            const model = genAI.getGenerativeModel({
                model: modelName,
            });

            // 4. Retrieve Active Files from Google File API
            const listFilesResponse = await fileManager.listFiles();

            // 状態別に分類
            const SUPPORTED_MIME_TYPES = [
                'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/csv', 'text/markdown',
                'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
                'application/pdf'
            ];

            const activeFiles = listFilesResponse.files.filter(f =>
                f.state === "ACTIVE" &&
                // Office系などが混入していた場合、APIエラーになるため除外する
                // (新規アップロード分は text/plain に変換されているが、過去分対策)
                !f.mimeType.includes('officedocument') &&
                !f.mimeType.includes('wordprocessingml') &&
                !f.mimeType.includes('spreadsheetml')
            );
            const processingFiles = listFilesResponse.files.filter(f => f.state === "PROCESSING");
            const failedFiles = listFilesResponse.files.filter(f => f.state === "FAILED");

            // ログ用に記録
            console.log("[RAG Update] Files Status:", {
                active: activeFiles.length,
                processing: processingFiles.length,
                failed: failedFiles.length
            });

            // もし処理中のファイルがあり、かつ有効なファイルが1つもない場合は、ユーザーに待ってもらう
            if (activeFiles.length === 0 && processingFiles.length > 0) {
                return new Response(JSON.stringify({
                    reply: "申し訳ありません。現在、アップロードされた資料をAIが読み込んでいる最中です（処理中）。\n数秒〜1分ほど待ってから、もう一度話しかけてください。🦉"
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }

            // ログ用にファイル名を記録
            fileUrisLog = activeFiles.map(f => f.displayName || f.name);

            // 5. Construct Contents
            // システムプロンプトを明示的に設定
            const systemInstruction = {
                role: "system",
                parts: [
                    { text: "あなたは自治体の有能なアシスタントです。添付の資料群に基づいて、ユーザーの質問に日本語で丁寧に回答してください。資料にない情報については推測せず、「資料には記載がありません」と答えてください。" + (activeFiles.length === 0 ? "\n\n現在、参照できる資料（RAG）はありません。一般的な知識で回答してください。" : "") }
                ]
            };

            // ファイルデータを含むメッセージ部分
            const fileParts: Part[] = [];
            for (const file of activeFiles) {
                fileParts.push({
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri
                    }
                });
            }

            // 履歴の構築
            const historyContents = messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content } as Part],
            }));

            // ファイルがある場合、履歴の先頭（最初のユーザー発言）に統合するか、独立したコンテキストとして挿入する。
            let contents = [...historyContents];

            if (fileParts.length > 0) {
                const fileContextMessage = {
                    role: "user",
                    parts: [...fileParts, { text: "これらの資料を参照して、以下の質問に答えてください。" } as Part]
                };
                // 先頭に追加
                contents = [fileContextMessage, ...historyContents];
            }

            // 6. Generate Content
            const result = await model.generateContent({
                contents,
                systemInstruction,
                generationConfig: {
                    maxOutputTokens: 1024,
                    temperature: 0.2,
                    topP: 0.95,
                    topK: 40,
                }
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
                ragType: "google-file-api-dynamic",
                fileCount: fileUrisLog.length,
                thinking: "disabled"
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
