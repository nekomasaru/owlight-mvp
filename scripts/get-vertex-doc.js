
const { DocumentServiceClient } = require('@google-cloud/discoveryengine');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function getDoc() {
    const client = new DocumentServiceClient({ keyFilename: path.join(__dirname, '../service-account.json') });

    // Test with the IDs we found in RAG
    const ids = ['c310c93ffd1e1609d5f8b462ef47046a', '20852af90c9986c97f4e0315f0b018a6'];
    const project = process.env.GCP_PROJECT_ID;
    const location = 'global';
    const collection = 'default_collection';
    const dataStore = process.env.VERTEX_DATA_STORE_ID || process.env.GCP_VERTEX_DATASTORE_ID;

    for (const id of ids) {
        const name = `projects/${project}/locations/${location}/collections/${collection}/dataStores/${dataStore}/branches/0/documents/${id}`;
        console.log(`\nFetching Document: ${name}`);

        try {
            const [doc] = await client.getDocument({ name });
            console.log(`ID: ${doc.id}`);
            console.log(`Title: ${doc.derivedStructData?.fields?.title?.stringValue || 'N/A'}`);
            console.log(`Keys:`, Object.keys(doc));
            if (doc.structData) {
                console.log(`structData Keys:`, Object.keys(doc.structData.fields || {}));
            }
            if (doc.derivedStructData) {
                console.log(`derivedStructData Keys:`, Object.keys(doc.derivedStructData.fields || {}));
            }
            // Print a bit of content if it's there
            const content = JSON.stringify(doc.structData || doc.derivedStructData).substring(0, 500);
            console.log(`Content Snapshot: ${content}...`);
        } catch (e) {
            console.error(`Error fetching ${id}:`, e.message);
        }
    }
}

getDoc().catch(console.error);
