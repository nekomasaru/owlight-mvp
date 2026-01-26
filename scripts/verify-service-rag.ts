
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Import VertexAISearchService BUT we need the container to be ready
import { container } from '../src/di/container';
import { VertexAISearchService } from '../src/infrastructure/VertexAiSearchService';

async function verifyService() {
    console.log("Initializing Service...");
    const service = new VertexAISearchService();
    const query = "情報公開における不開示理由の種類は何種類ありますか？";

    console.log(`Verifying VertexAISearchService with query: "${query}"`);
    const response = await service.search(query);

    console.log(`\nFound ${response.citations.length} citations.`);
    response.citations.forEach((c, i) => {
        console.log(`\n[Citation ${i + 1}] Title: ${c.title}`);
        console.log(`Content Length: ${c.contentSnippet.length}`);
        console.log(`Snippet Preview (Safe): ${c.contentSnippet.substring(0, 100).replace(/\n/g, ' ')}...`);
    });

    const hasEightTypes = response.citations.some(c => c.contentSnippet.includes('1. 個人情報') && c.contentSnippet.includes('8. 法令秘情報'));
    console.log(`\nVerification Result: ${hasEightTypes ? 'PASS (Full context found)' : 'FAIL (Only snippets found)'}`);
}

verifyService().catch(console.error);
