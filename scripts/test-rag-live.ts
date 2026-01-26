
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { container } from '../src/di/container';

async function testRagLive() {
    // Dynamically import container AFTER dotenv is loaded
    const { container } = await import('../src/di/container');

    const query = "verify the GCS sync script";
    console.log(`\n--- Live RAG Search Test ---`);
    console.log(`Query: "${query}"`);

    try {
        const ragService = container.ragService;
        const response = await ragService.search(query, 'test-session-' + Date.now());

        console.log(`\nResults Found: ${response.citations.length}`);
        console.log(`Native Answer (Summary): ${response.answer || 'NONE'}`);

        response.citations.forEach((c, i) => {
            console.log(`\n[Citation ${i + 1}]`);
            console.log(`ID: ${c.id}`);
            console.log(`Title: ${c.title}`);
            console.log(`Snippet: ${c.contentSnippet?.substring(0, 150)}...`);
        });

        if (response.citations.length === 0) {
            console.log('\nRetrying with shorter query: "不開示理由"');
            const response2 = await ragService.search("不開示理由", 'test-session-2-' + Date.now());
            console.log(`Results Found: ${response2.citations.length}`);
            response2.citations.forEach((c, i) => {
                console.log(`  - ${c.title} (ID: ${c.id})`);
            });
        }

    } catch (error) {
        console.error('Search failed:', error);
    }
}

testRagLive();
