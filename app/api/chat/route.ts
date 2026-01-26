import { container } from '@/src/di/container';

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
        const { messages, model: requestedModel, mentorMode, stamina, conversationId, useGeneralKnowledge } = await req.json() as {
            messages: { role: "user" | "assistant"; content: string }[];
            model?: string;
            mentorMode?: boolean;
            stamina?: number;
            conversationId?: string;
            useGeneralKnowledge?: boolean;
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
            // 3. RAG Retrieval (Vertex AI Search ONLY)
            // Architecture: Knowledge Sync Script syncs Supabase -> Vertex. 
            // Vertex indexes both Manuals (GCS) and Internal Knowledge (GCS).
            const ragService = container.ragService;
            const knowledgeRepo = container.knowledgeRepository;

            // Fetch from Vertex AI (Single Source of Truth)
            const vertexResponse = await ragService.search(userQuery, conversationId);
            ragSources = vertexResponse.citations || [];

            // 4. Construct Context
            // Fetch System Prompt from Supabase
            let systemPromptContent = `あなたはOWLightの賢者「Mr.OWL」です。自治体職員のパートナーとして、丁寧かつ温かい「恩送り（Pay it Forward）」の精神で回答してください。`;
            try {
                const prompt = await knowledgeRepo.getPrompt('system_prompt');
                if (prompt) {
                    systemPromptContent = prompt;
                }
            } catch (error) {
                console.error("Failed to fetch system prompt from Supabase, using default.", error);
            }

            // Construct RAG Context from Vertex Response
            let vertexContext = "";
            const vertexAnswer = vertexResponse.answer || "";
            // Ignore generic refusals from Vertex to let our LLM try with snippets
            const isRefusal = vertexAnswer.includes("I cannot answer") || vertexAnswer.includes("申し訳ありません") || vertexAnswer.length < 5;
            const hasCitations = vertexResponse.citations.length > 0;

            // ENHANCEMENT: Fetch metadata from Supabase for knowledge items (UUID-based IDs)
            // This ensures we get correct titles and clean content from the canonical source
            const enrichedCitations = await Promise.all(vertexResponse.citations.map(async (c: any) => {
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id);

                if (isUUID) {
                    try {
                        const knowledge = await knowledgeRepo.getKnowledge(c.id);
                        if (knowledge) {
                            return {
                                ...c,
                                id: knowledge.id, // Force canonical UUID
                                title: knowledge.title || c.title,
                                contentSnippet: knowledge.content || c.contentSnippet,
                                sourceType: 'user_submission', // Mark as knowledge item
                                authorId: knowledge.createdBy // Pass author ID to frontend
                            };
                        }
                    } catch (e) {
                        console.warn(`[RAG] Failed to fetch knowledge ${c.id} from Supabase, using Vertex data.`, e);
                    }
                }
                return c;
            }));

            if (hasCitations) {
                const list = enrichedCitations.map((c: any, i: number) => {
                    let title = c.title || '無題の資料';
                    // Fallback for raw UUIDs if still not resolved
                    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(title)) {
                        title = '現場の知恵 (ナレッジ)';
                    }
                    return `【資料[${i + 1}]】${title}\n(内容抽出):\n${c.contentSnippet}`;
                }).join('\n\n==== DOCUMENT SEPARATOR ====\n\n');

                vertexContext = `
### 検索・参照資料 (全文/主要部)
以下の提供された各資料の内容を**深く分析・読み解き**、ユーザーの質問に対する回答を導き出してください。
資料内に回答が直接的な文章として存在しない場合でも、全体を通読することで論理的に導き出せる場合は、その推論過程も含めて回答してください。

${list}
`;
            } else {
                vertexContext = `
### 参照資料
今回の質問に直接回答するための資料は見つかりませんでした。
`;
            }

            // STRICT MODE LOGIC
            let strictModeInstruction = "";
            let modeBadgeInfo = false;

            if (useGeneralKnowledge) {
                // GENERAL KNOWLEDGE MODE
                strictModeInstruction = `
### モード: 一般知識解禁 (General Knowledge Enabled)
- 検索結果に情報がない場合でも、あなたの持つ**一般的な専門知識や行政知識**を使って回答を作成してください。
- ただし、回答の冒頭に必ず「⚠️ これは一般知識に基づく回答であり、庁内の正式な規定とは異なる可能性があります。」と明記してください。
- 検索結果に情報がある場合は、それを最優先で利用してください。
`;
                modeBadgeInfo = true;
            } else {
                // STRICT MODE (Default)
                strictModeInstruction = `
### モード: 厳格な情報参照 (Strict Reference Mode) - 絶対遵守
- **最重要ルール**: あなたは提供された【参照資料】に**明示的に書かれている情報のみ**を使って回答しなければなりません。
- 参照資料に書かれていない専門用語の説明、制度の詳細、背景知識などを**一切追加しないでください**。
- 参照資料に無い情報について聞かれた場合: 「申し訳ありません。ご質問の内容に関する情報は、現在登録されているナレッジやマニュアルの中には見当たりませんでした。」と正直に回答してください。
- **例外: ユーザーが新しい知識を教えてくれた場合**（「〜って知ってる？」「〜なんだよ」など）は、その情報を受け止め、感謝を伝え、ナレッジ登録を提案してください（詳細は後述のナレッジ抽出セクション参照）。
- 曖昧な記憶や幻覚（ハルシネーション）による回答は**絶対禁止**です。
`;
            }

            // Mentor Mode Logic
            let mentorContext = "";
            if (mentorMode) {
                mentorContext = `\n\n### メンターモード (新人職員サポート機能) ON 🔰
現在、相手は「新人職員」です。以下の追加指示に従ってください：
- **専門用語の噛み砕き**: 行政用語や専門用語を使う際は、必ずカッコ書きで補足説明を加えてください。
- **背景の補足**: 単に答えを教えるだけでなく、「なぜそうするのか」という背景や文脈を丁寧に説明してください。
- **励まし**: 不安を取り除くため、通常よりも温かく、肯定的な言葉掛けを意識してください。`;
            }

            // Knowledge Distillation Instructions
            // ... (keeping existing logic) ...
            const knowledgeDistillationPrompt = `
### ナレッジ抽出 (最重要 - 必ず実行)
**ユーザーが情報を提供した場合は、以下の形式でXMLタグを必ず出力してください**

**トリガー条件（以下のいずれかに該当する場合、必ずタグを出力）:**
- 「〜って知ってる？」「〜だよ」「〜なんだ」のような形式でユーザーが事実を教えてくれた
- 「〜には〜されない」「〜は〜しない」のような規則・例外を伝えてくれた
- 具体的な業務手順、現場のコツ、ノウハウを語った

**必須出力形式（コードブロックなしで、このままの形式で出力）:**
<knowledge_proposal>
<title>ユーザーが教えてくれた内容の短い要約タイトル</title>
<content>ユーザーが教えてくれた知見の具体的な内容（200文字程度）</content>
<tags>関連タグ1,関連タグ2</tags>
</knowledge_proposal>

**具体例:**
ユーザー: 「支店には法人番号が付番されないって知ってる？」
→ 回答の最後に以下を必ず追加:
<knowledge_proposal>
<title>法人番号は支店には付番されない</title>
<content>法人番号は法人そのものに付与される番号であり、支店や事業所といった個別の拠点には付与されない。</content>
<tags>法人番号,支店</tags>
</knowledge_proposal>

**絶対ルール:**
- 上記トリガー条件に該当する場合、XMLタグの出力は**省略禁止**です。
- タグはレスポンスの最後尾に配置してください。
- 「ナレッジとして登録しませんか？」という提案メッセージを書いた後、必ずXMLタグも出力してください。
`;

            // Combine System Instruction
            const systemInstruction = `${systemPromptContent}
            
            ${vertexContext}

            ${strictModeInstruction}

            **回答のルール:**
            - 引用元がある場合は、文中に必ず [1] [2] のように資料番号を付記して、どの資料を参照したか明示してください。
            
            ${mentorContext}
            
            ${knowledgeDistillationPrompt}`;

            // 5. Generate with LLM Service
            const llmService = container.llmService;
            const finalPrompt = `${systemInstruction}\n\nユーザーの質問: ${userQuery}`;

            // Filter history to last 5 turns
            const textHistory = messages.slice(-5);

            responseText = await llmService.generateCompletion(finalPrompt, textHistory);
            success = true;

            // Parse Knowledge Proposal (More robust regex handling optional markdown blocks wrapped by AI)
            let knowledgeDraft = null;
            const knowledgeMatch = responseText.match(/<knowledge_proposal>([\s\S]*?)<\/knowledge_proposal>/i);
            if (knowledgeMatch) {
                const xmlContent = knowledgeMatch[1];
                const titleMatch = xmlContent.match(/<title>([\s\S]*?)<\/title>/i);
                const contentMatch = xmlContent.match(/<content>([\s\S]*?)<\/content>/i);
                const tagsMatch = xmlContent.match(/<tags>([\s\S]*?)<\/tags>/i);

                if (titleMatch && contentMatch) {
                    knowledgeDraft = {
                        title: titleMatch[1].trim(),
                        content: contentMatch[1].trim(),
                        tags: tagsMatch ? tagsMatch[1].split(',').map((t: string) => t.trim()) : []
                    };
                }
                // Cleanup: remove the tag and any surrounding code blocks
                responseText = responseText.replace(/```[a-z]*\n?<knowledge_proposal>[\s\S]*?<\/knowledge_proposal>\n?```/gi, '');
                responseText = responseText.replace(/<knowledge_proposal>[\s\S]*?<\/knowledge_proposal>/gi, '').trim();
            }

            // Include Vertex Citations in response
            // Add [N] to titles for better UX, preferring actual metadata over raw IDs
            const finalCitations = enrichedCitations.map((c: any, index: number) => {
                let displayTitle = c.title || '無題の資料';
                // If title is a raw UUID, it's likely a knowledge file name without metadata title
                if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(displayTitle)) {
                    displayTitle = '現場の知恵 (ナレッジ)';
                }

                return {
                    id: c.id,
                    title: `[${index + 1}] ${displayTitle}`,
                    text: c.contentSnippet || c.text, // Prefer Supabase content over raw Vertex data
                    sourceType: c.sourceType || 'official',
                    authorId: c.authorId // Pass author ID
                };
            });

            return new Response(JSON.stringify({
                reply: responseText,
                citiedKnowledge: [], // Frontend handles combined view
                vertexCitations: finalCitations,
                knowledgeDraft: knowledgeDraft, // NEW: Knowledge extraction proposal
                isGeneralKnowledge: useGeneralKnowledge // Flag for frontend badge
            }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });

        } catch (llmError: any) {
            success = false;
            errorMessage = llmError instanceof Error ? llmError.message : String(llmError);
            console.error("LLM/RAG Error:", llmError);

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
