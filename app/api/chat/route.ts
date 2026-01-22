import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleAIFileManager } from "@google/generative-ai/server";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// 最も安定している gemini-1.5-flash-latest を使用
const modelName = "gemini-1.5-flash-latest";

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
        const { messages, model: requestedModel } = await req.json() as {
            messages: { role: "user" | "assistant"; content: string }[];
            model?: string;
        };

        // Determine which model to use
        let activeModelName = modelName; // Default
        if (requestedModel === 'gemini-2.0-flash') {
            activeModelName = 'gemini-2.0-flash-exp';
        } else if (requestedModel === 'gemini-2.5-flash') {
            activeModelName = 'gemini-2.5-flash'; // Connect directly as requested
        }

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
                model: activeModelName,
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
            // Firestoreからシステムプロンプトを取得
            let systemPromptContent = `あなたはOWLightの賢者「Mr.OWL」です。自治体職員のパートナーとして、丁寧かつ温かい「恩送り（Pay it Forward）」の精神で回答してください。

以下のガイドラインを厳守してください：
1. **構造化と視覚化**: 情報を整理し、必ず以下の**Markdown見出しまたは太字**の構成で回答してください：
   - **結論**: 質問に対する端的な答え。
   - **理由・背景**: 資料などに基づいた根拠。
   - **詳細解説**: **Markdown形式の表（\`| \`で区切る）**、**箇条書き**、**見出し（###）**を積極的に活用し、一目で内容が理解できるようにしてください。
     - **重要**: 表（Table）を作成する際は、必ず前後に**空行**を入れ、ヘッダーの直下に「|---|---|」のような区切り行を記述してください。
     - **禁止**: HTMLタグや改行タグは使用せず、必ずMarkdown構文のみを使用してください。
   - **補足・アドバイス**: 運用上の注意点や、次に繋がる知恵の共有。
2. **労いと共感**: 回答の冒頭では職員の多忙さを労う言葉を添えてください。
3. **伴走者のトーン**: 親しみやすい日本語（「ですね」「ですよ」）を使い、適度に絵文字（🦉, ✨, 📝）を交えてください。
4. **知恵の価値付け**: 「この疑問はきっと他の職員さんの助けにもなりますね」といった言葉を添えてください。
5. **事実に基づいた誠実さ**: 添付資料を最優先し、ない場合は代替案を提案してください。
6. **恩送りの結び**: 最後は前向きな言葉で締めくくってください。`;

            try {
                const docRef = doc(db, 'settings', 'system_prompt');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().content) {
                    systemPromptContent = docSnap.data().content;
                }
            } catch (error) {
                console.error("Failed to fetch system prompt from Firestore, using default.", error);
            }

            // Append dynamic context based on file availability
            const systemInstruction = `${systemPromptContent}

${activeFiles.length === 0 ? "\n現在、参照できる最新の資料はありません。一般的な知識で回答してください。" : "添付された資料の内容を最優先で参照してください。"}`;

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
                    maxOutputTokens: 8192,
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

        } catch (llmError: any) {
            success = false;
            errorMessage = llmError instanceof Error ? llmError.message : String(llmError);
            console.error("Gemini API Error:", llmError);

            // 503 (Overloaded) や 429 (Quota) の場合は Mr.OWL として優しく再案内する
            if (llmError?.status === 503 || llmError?.status === 429 || errorMessage.includes("503") || errorMessage.includes("429") || errorMessage.includes("overloaded") || errorMessage.includes("quota")) {
                return new Response(JSON.stringify({
                    reply: "申し訳ありません。現在、知恵の森（AIサーバー）が大変混み合っているか、一時的な制限に達してしまったようです。🦉💦\n今日もお疲れ様です。少しだけ（1分ほど）深呼吸をして、もう一度話しかけていただけますか？あなたの質問は大切に受け止めます。✨"
                }), {
                    status: 200, // ユーザー画面でエラー表示にせず、チャットとして返答する
                    headers: { "Content-Type": "application/json" },
                });
            }

            return new Response(JSON.stringify({ error: "Failed to generate content" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        } finally {
            const durationMs = Date.now() - start;
            const logObject = {
                timestamp: new Date().toISOString(),
                route: "/api/chat",
                model: activeModelName,
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
