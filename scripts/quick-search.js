
const { SearchServiceClient } = require('@google-cloud/discoveryengine');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function quickSearch() {
    const client = new SearchServiceClient({ keyFilename: path.join(__dirname, '../service-account.json') });
    const config = `projects/${process.env.GCP_PROJECT_ID}/locations/global/collections/default_collection/engines/${process.env.GCP_VERTEX_APP_ID || 'owlight-search_1769272848383'}/servingConfigs/default_search`;

    console.log(`Searching Vertex: "不開示"`);
    const [results] = await client.search({
        pageSize: 10,
        query: "不開示",
        servingConfig: config,
        contentSearchSpec: { snippetSpec: { returnSnippet: true } }
    });

    console.log(`Found ${results.length} results.`);
    results.forEach((result, i) => {
        const doc = result.document;
        const derived = doc.derivedStructData;
        const struct = doc.structData;

        const getVal = (source, key) => {
            if (!source) return null;
            if (source[key] !== undefined && source[key] !== null) {
                const val = source[key];
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    if (val.stringValue !== undefined) return val.stringValue;
                    return val;
                }
                return val;
            }
            const fields = source.fields || source;
            if (fields && fields[key]) {
                const val = fields[key];
                if (val.stringValue !== undefined) return val.stringValue;
                return val;
            }
            return null;
        };

        const tryGetSnippet = (source) => {
            if (!source) return '';
            const fields = source.fields || source;
            const arrays = fields.snippets || fields.extractive_answers;
            const list = (arrays?.listValue?.values) || (Array.isArray(arrays) ? arrays : null);
            if (Array.isArray(list) && list.length > 0) {
                for (const item of list) {
                    const itemStruct = item.structValue?.fields || item;
                    const text = getVal(itemStruct, 'snippet') || getVal(itemStruct, 'content');
                    if (text) return String(text);
                }
            }
            return '';
        };

        const snippet = tryGetSnippet(derived) || tryGetSnippet(struct);
        const title = getVal(derived, 'title') || getVal(struct, 'title') || doc.id;

        console.log(`\n[${i + 1}] ID: ${doc.id}`);
        console.log(`Title: ${title}`);
        console.log(`Snippet: ${snippet.substring(0, 100)}...`);
    });
}

quickSearch().catch(console.error);
