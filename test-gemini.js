const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load env locally (simplified)
const apiKey = "AIzaSyCM-DIY1qM3nsUQOjxGukKwOfzlT5Nd_OQ";

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const list = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; // Dummy call to check if instantiates
        console.log("Checking connectivity...");
        // There isn't a direct listModels on the client SDK easily accessible in node without full auth setup sometimes, 
        // but we can try a different approach or just test 'gemini-1.0-pro'

        // Instead of listing (which requires OAuth often), let's try generating with a very specific latest model name
        // 'gemini-1.5-flash-latest' or 'gemini-1.0-pro'
        console.log("Trying gemini-1.0-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.0-pro:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
