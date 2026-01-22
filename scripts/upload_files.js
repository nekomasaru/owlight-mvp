const { GoogleAIFileManager } = require("@google/generative-ai/server");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

function loadEnv() {
    try {
        const envPath = path.join(__dirname, "../.env.local");
        const envContent = fs.readFileSync(envPath, "utf8");
        const match = envContent.match(/GEMINI_API_KEY=(.*)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    } catch (e) {
        console.warn(".env.local not found or invalid.");
    }
    return process.env.GEMINI_API_KEY;
}

const apiKey = loadEnv();

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY not found in .env.local");
    process.exit(1);
}

const fileManager = new GoogleAIFileManager(apiKey);

async function upload() {
    const filePath = path.join(__dirname, "../docs/manual.md");

    console.log(`Uploading file: ${filePath}...`);

    try {
        const uploadResponse = await fileManager.uploadFile(filePath, {
            mimeType: "text/plain",
            displayName: "庁内DXガイドラインv1",
        });

        console.log(`File uploaded successfully!`);
        console.log(`URI: ${uploadResponse.file.uri}`);

        // URIをファイルに保存
        const uriPath = path.join(__dirname, "latest_uri.txt");
        fs.writeFileSync(uriPath, uploadResponse.file.uri);
        console.log(`URI saved to ${uriPath}`);

    } catch (error) {
        console.error("Upload failed:", error);
    }
}

upload();
