import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { message } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

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
