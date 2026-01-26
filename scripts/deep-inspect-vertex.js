
const { SearchServiceClient } = require('@google-cloud/discoveryengine');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function deepInspect() {
    const client = new SearchServiceClient({ keyFilename: path.join(__dirname, '../service-account.json') });
    const config = `projects/${process.env.GCP_PROJECT_ID}/locations/global/collections/default_collection/engines/${process.env.GCP_VERTEX_APP_ID || 'owlight-search_1769272848383'}/servingConfigs/default_search`;

    console.log(`Searching Vertex for Deep Inspection...`);
    const [results] = await client.search({
        pageSize: 1,
        query: "不開示",
        servingConfig: config
    });

    if (!results || results.length === 0) {
        console.log("No results found to inspect.");
        return;
    }

    const doc = results[0].document;
    console.log("\n--- Top Level Document Keys ---");
    console.log(Object.keys(doc));

    function inspect(obj, prefix = '', limit = 2) {
        if (limit < 0 || !obj || typeof obj !== 'object') return;

        for (const key of Object.keys(obj)) {
            const val = obj[key];
            const type = Array.isArray(val) ? 'array' : typeof val;
            console.log(`${prefix}${key} (${type})`);

            if (type === 'object' && key !== 'client') {
                inspect(val, prefix + '  ', limit - 1);
            }
        }
    }

    console.log("\n--- Structural Inspection ---");
    inspect(doc);

    console.log("\n--- Detailed content search ---");
    if (doc.derivedStructData) {
        console.log("derivedStructData keys:", Object.keys(doc.derivedStructData));
        if (doc.derivedStructData.fields) {
            console.log("derivedStructData.fields keys:", Object.keys(doc.derivedStructData.fields));
            for (const f of Object.keys(doc.derivedStructData.fields)) {
                console.log(`  Field [${f}]:`, JSON.stringify(doc.derivedStructData.fields[f]));
            }
        }
    }
}

deepInspect().catch(console.error);
