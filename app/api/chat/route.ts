import { container } from '@/src/di/container';
import { db } from '@/lib/firebase'; // Keep for system prompt fetching only (temporary)
import { doc, getDoc } from 'firebase/firestore';

// In-memory rate limiter
const requestsMap = new Map<string, number[]>();

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        const now = Date.now();
        const windowMs = 60_000;
        const rateLimit = 10; // Relaxed a bit for stability

        const timestamps = (requestsMap.get(ip) ?? []).filter(
            (t) => now - t < windowMs
        );

        if (timestamps.length >= rateLimit) {
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
        const { messages, model: requestedModel, mentorMode, stamina } = await req.json() as {
            messages: { role: "user" | "assistant"; content: string }[];
            model?: string;
            mentorMode?: boolean;
            stamina?: number;
        };

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid messages format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        const userQuery = lastUserMessage ? lastUserMessage.content : "";

        // Logging variables
        const start = Date.now();
        let responseText = "";
        let success = false;
        let errorMessage: string | null = null;
        let ragSources: any[] = [];

        try {
            // 3. RAG Retrieval (Vertex AI Search & Supabase Knowledge)
            const ragService = container.ragService;
            const knowledgeRepo = container.knowledgeRepository;

            // Parallel fetch: Vertex AI Search + Top Knowledge from Supabase
            const [vertexResponse, topKnowledge] = await Promise.all([
                ragService.search(userQuery),
                knowledgeRepo.getTopKnowledge(5)
            ]);

            ragSources = vertexResponse.citations;

            // 4. Construct Context
            // Firestoreからシステムプロンプトを取得 (ここだけ移行過渡期として維持)
            let systemPromptContent = `あなたはOWLightの賢者「Mr.OWL」です。自治体職員のパートナーとして、丁寧かつ温かい「恩送り（Pay it Forward）」の精神で回答してください。`;
            try {
                const docRef = doc(db, 'settings', 'system_prompt');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().content) {
                    systemPromptContent = docSnap.data().content;
                }
            } catch (error) {
                console.error("Failed to fetch system prompt from Firestore, using default.", error);
            }

            // Knowledge Context (from Supabase)
            let knowledgeContext = "";
            if (topKnowledge.length > 0) {
                const list = topKnowledge.map(d => {
                    return `- ${d.content} (関連タグ:${d.structuredData?.tags?.join(', ') || 'なし'})`;
                }).join('\n');
                knowledgeContext = `\n\n### 庁内の共有ナレッジ (現場の知恵)\n以下の情報は、現場職員によって高く評価された重要な知恵です。関連性が高ければ参照してください：\n${list}`;
            }

            // Vertex AI Search Context
            let vertexContext = "";
            console.log("[ChatAPI] Vertex Response Answer:", vertexResponse.answer);
            console.log("[ChatAPI] Vertex Citations Count:", vertexResponse.citations.length);

            // Use the Vertex Answer as the primary source if available
            if (vertexResponse.answer) {
                vertexContext = `\n\n### マニュアル検索結果 (Vertex AI)\nVertex AI Searchがマニュアルから以下の回答を生成しました。これを参考に、ユーザーへの回答を補完してください：\n${vertexResponse.answer}`;

                // Append citations if they exist
                if (vertexResponse.citations.length > 0) {
                    const list = vertexResponse.citations.map(c => `[出典:${c.title}]\n${c.contentSnippet}`).join('\n\n');
                    vertexContext += `\n\n#### 参照スニペット:\n${list}`;
                }
            } else if (vertexResponse.citations.length > 0) {
                // Fallback to snippets if no generative answer but citations exist
                const list = vertexResponse.citations.map(c => `[出典:${c.title}]\n${c.contentSnippet}`).join('\n\n');
                vertexContext = `\n\n### マニュアル検索結果 (Vertex AI)\n以下の公式マニュアルやドキュメントを**最優先の根拠**として回答を作成してください：\n${list}`;
            } else {
                vertexContext = `\n\n### マニュアル検索結果\n該当するマニュアルは見つかりませんでした。一般的な知識または前後の文脈から回答してください。`;
            }

            // Mentor Mode Logic
            let mentorContext = "";
            if (mentorMode) {
                mentorContext = `\n\n### メンターモード (新人職員サポート機能) ON 🔰
現在、相手は「新人職員」です。以下の追加指示に従ってください：
- **専門用語の噛み砕き**: 行政用語や専門用語を使う際は、必ずカッコ書きで補足説明（例：「起案（稟議書を作ること）」）を加えてください。
- **背景の補足**: 単に答えを教えるだけでなく、「なぜそうするのか」という背景や文脈を丁寧に説明してください。
- **ステップバイステップ**: 手順が複雑な場合は、番号付きリストで一つずつ分解して案内してください。
- **励まし**: 不安を取り除くため、通常よりも温かく、肯定的な言葉掛けを意識してください。`;
            }

            // Combine System Instruction
            const systemInstruction = `${systemPromptContent}
            
            ${vertexContext}
            
            ${knowledgeContext}
            
            ${mentorContext}`;

            // 5. Generate with LLM Service
            const llmService = container.llmService;

            // Construct prompt efficiently using only the latest query + instruction context
            // Or passing full history if supported by the service efficiently
            // Here we concatenate the system instruction to the latest prompt for simplicity with the stateless generic interface
            const finalPrompt = `${systemInstruction}\n\nユーザーの質問: ${userQuery}`;

            // Filter history to last 5 turns to prevent token overflow
            const textHistory = messages.slice(-5);

            responseText = await llmService.generateCompletion(finalPrompt, textHistory);
            success = true;

            const citiedKnowledgeDocs = topKnowledge.map(k => ({
                id: k.id,
                author: 'System', // Supabase currently doesn't join user name easily here without new view
                content: k.summary || k.title
            }));

            // Include Vertex Citations in response for UI to display (as 'File' type citations)
            const finalCitations = vertexResponse.citations.map(c => ({
                id: c.id,
                title: c.title,
                text: c.contentSnippet
            }));

            return new Response(JSON.stringify({
                reply: responseText,
                citiedKnowledge: citiedKnowledgeDocs,
                vertexCitations: finalCitations
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } catch (llmError: any) {
            success = false;
            errorMessage = llmError instanceof Error ? llmError.message : String(llmError);
            console.error("LLM/RAG Error:", llmError);

            // Error handling logic
            if (errorMessage.includes("503") || errorMessage.includes("429")) {
                return new Response(JSON.stringify({
                    reply: "申し訳ありません。現在、知恵の森（AIサーバー）が大変混み合っています。少し時間をおいて再度お試しください。🦉💦"
                }), { status: 200, headers: { "Content-Type": "application/json" } });
            }

            return new Response(JSON.stringify({ error: "Failed to generate content" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

    } catch (error) {
        console.error("API Route Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
