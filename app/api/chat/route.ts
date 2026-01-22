import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// In-memory rate limiter: Map<IP, timestamps[]>
const requestsMap = new Map<string, number[]>();

export async function POST(req: Request) {
    try {
        // 1. Rate Limiting Logic
        const ip = req.headers.get("x-forwarded-for") ?? "unknown";
        const now = Date.now();
        const windowMs = 60_000; // 1 minute
        const limit = 5;         // 5 requests per minute

        // Filter out timestamps older than the window
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

        // Record this request
        timestamps.push(now);
        requestsMap.set(ip, timestamps);

        // 2. Parse Request
        // Expecting: { messages: { role: 'user' | 'assistant', content: string }[] }
        const { messages } = await req.json() as {
            messages: { role: "user" | "assistant"; content: string }[];
        };

        // Validate messages
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response(JSON.stringify({ error: "Invalid messages format" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        const userInputLength = lastUserMessage ? lastUserMessage.content.length : 0;

        // Variables for logging
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
                    maxOutputTokens: 512,
                    temperature: 0.7,
                }
            });

            // 4. Transform messages for Gemini
            // Gemini expects: { role: 'user' | 'model', parts: [{ text: string }] }
            const contents = messages.map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            }));

            // 5. Generate Content
            const result = await model.generateContent({
                contents,
            });

            const response = await result.response;
            responseText = response.text();
            success = true;

            // 6. Return Response
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
            // Logging Logic
            const durationMs = Date.now() - start;
            const logObject = {
                timestamp: new Date().toISOString(),
                route: "/api/chat",
                model: modelName,
                userInputLength,
                responseLength: responseText.length,
                durationMs,
                success,
                errorMessage
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
