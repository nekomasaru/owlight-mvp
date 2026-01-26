import { GoogleGenerativeAI } from "@google/generative-ai";
import { ILlmService } from "../domain/interfaces/ILlmService";

export class GeminiLlmService implements ILlmService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    }

    async generateCompletion(prompt: string, history: any[] = []): Promise<string> {
        try {
            // Ensure history starts with 'user' role
            let adjustedHistory = [...history];

            // Debug logging
            console.log('Original History Roles:', history.map(h => h.role));

            while (adjustedHistory.length > 0 && adjustedHistory[0].role !== 'user') {
                console.log('Dropping invalid start role:', adjustedHistory[0].role);
                adjustedHistory.shift();
            }

            console.log('Adjusted History Roles:', adjustedHistory.map(h => h.role));

            const chat = this.model.startChat({
                history: adjustedHistory.map(h => ({
                    role: h.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: h.content }]
                }))
            });

            const result = await chat.sendMessage(prompt);
            return result.response.text();
        } catch (e) {
            console.error("Gemini Generation Error:", e);
            throw e;
        }
    }

    async distill(content: string, instructions: string): Promise<string> {
        try {
            const prompt = `${instructions}\n\nTarget Content:\n${content}`;
            const result = await this.model.generateContent(prompt);
            return result.response.text();
        } catch (e) {
            console.error("Gemini Distillation Error:", e);
            return "";
        }
    }
}
