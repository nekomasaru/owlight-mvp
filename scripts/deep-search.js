
const { SearchServiceClient } = require('@google-cloud/discoveryengine');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function deepSearch() {
    const client = new SearchServiceClient({ keyFilename: path.join(__dirname, '../service-account.json') });
    const config = `projects/${process.env.GCP_PROJECT_ID}/locations/global/collections/default_collection/engines/${process.env.GCP_VERTEX_APP_ID || 'owlight-search_1769272848383'}/servingConfigs/default_search`;

    console.log(`Deep Searching Vertex: "不開示理由 8種類"`);
    const [results] = await client.search({
        pageSize: 5,
        query: "不開示理由 8種類",
        servingConfig: config,
        contentSearchSpec: {
            snippetSpec: { returnSnippet: true, maxSnippetCount: 5 },
            extractiveContentSpec: { maxNextStepsCount: 1, maxExtractiveAnswerCount: 5 }
        }
    });

    console.log(`Found ${results.length} results.`);
    results.forEach((result, i) => {
        const doc = result.document;
        const derived = doc.derivedStructData;

        console.log(`\n--- Result ${i + 1} [ID: ${doc.id}] ---`);

        const fields = derived?.fields || derived;
        if (!fields) {
            console.log("No fields found.");
            return;
        }

        // List all snippets found
        const snippetList = fields.snippets || fields.extractive_answers || fields.extractive_segments;
        const values = snippetList?.listValue?.values || (Array.isArray(snippetList) ? snippetList : []);

        console.log(`Segments/Snippets found: ${values.length}`);
        values.forEach((v, j) => {
            const item = v.structValue?.fields || v;
            const snippet = item.snippet?.stringValue || item.content?.stringValue || item.snippet || item.content;
            if (snippet) {
                console.log(`  [Chunk ${j + 1}]: ${String(snippet).substring(0, 200)}...`);
            }
        });
    });
}

deepSearch().catch(console.error);
