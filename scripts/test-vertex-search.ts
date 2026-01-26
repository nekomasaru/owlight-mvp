
const { SearchServiceClient } = require('@google-cloud/discoveryengine');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testSearch() {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = 'global';
    const collectionId = 'default_collection';
    const dataStoreId = process.env.GCP_VERTEX_DATASTORE_ID;

    console.log('Testing Vertex AI Search...');
    console.log(`Project ID: ${projectId}`);
    console.log(`Data Store ID: ${dataStoreId}`);

    if (!projectId || !dataStoreId) {
        console.error('Missing configuration variables.');
        return;
    }

    const client = new SearchServiceClient({
        keyFilename: path.join(__dirname, '../service-account.json')
    });

    /* TEST 1: Engine Access (Preferred) */
    console.log('\n--- TEST 1: Engine (App) Access ---');
    // Hardcoded from log or env
    const appId = process.env.GCP_VERTEX_APP_ID || 'owlight-search_1769272848383';
    const engineServingConfig = `projects/${projectId}/locations/${location}/collections/${collectionId}/engines/${appId}/servingConfigs/default_search`;

    console.log('Serving Config:', engineServingConfig);

    try {
        const query = '情報公開における不開示理由の種類は何種類ありますか？';
        console.log(`Searching for: ${query}`);

        const request = {
            pageSize: 5,
            query: query,
            servingConfig: engineServingConfig, // Use Engine config
            contentSearchSpec: {
                snippetSpec: { returnSnippet: true },
            }
        };

        const [response] = await client.search(request, { autoPaginate: false });
        console.log(`Results found: ${response.results ? response.results.length : 0}`);

        if (response.results) {
            response.results.forEach((r, i) => {
                const doc = r.document;
                const data = doc?.derivedStructData;
                let snippet = '';

                // Try to extract snippet from various possible locations
                if (data?.snippets?.[0]?.snippet) snippet = data.snippets[0].snippet;
                if (!snippet && data?.extractive_answers?.[0]?.content) snippet = data.extractive_answers[0].content;
                if (!snippet && data?.fields?.snippets?.listValue?.values?.[0]?.structValue?.fields?.snippet?.stringValue) {
                    snippet = data.fields.snippets.listValue.values[0].structValue.fields.snippet.stringValue;
                }

                // Fallback: Check if there's any other "content" field
                if (!snippet && data?.content) snippet = data.content.substring(0, 100) + '...';

                console.log(`\n--- Result ${i + 1} ---`);
                console.log(`Title: ${data?.title || doc?.id}`);
                console.log(`Snippet: ${snippet}`);
            });
        } else {
            console.log('No results found.');
        }
    } catch (e) {
        console.error('Error during search:', e);
    }
}

testSearch();
