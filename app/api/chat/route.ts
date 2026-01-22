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
        const { message } = await req.json();

        // 3. Configure Model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                maxOutputTokens: 512,
                temperature: 0.7,
            }
        });

        // 4. Generate Content
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: message }] }],
        });

        const response = await result.response;
        const text = response.text();

        // 5. Return Response
        return new Response(JSON.stringify({ reply: text }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return new Response(JSON.stringify({ error: "Failed to generate content" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
