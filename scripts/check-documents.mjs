
import { GoogleAuth } from 'google-auth-library';
import fs from 'fs';

function parseEnv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            config[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return config;
}

const envConfig = parseEnv('.env.local');
const project = envConfig.GCP_PROJECT_ID;
const dataStoreId = envConfig.GCP_VERTEX_DATASTORE_ID;

console.log(`Checking Data Store: ${dataStoreId}`);

async function test() {
    const auth = new GoogleAuth({
        keyFilename: './gcp-key.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    try {
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const accessToken = tokenResponse.token;

        // API Endpoint to list documents
        // projects/{project}/locations/{location}/collections/{collection}/dataStores/{dataStore}/branches/{branch}/documents
        const endpoint = `https://discoveryengine.googleapis.com/v1beta/projects/${project}/locations/global/collections/default_collection/dataStores/${dataStoreId}/branches/0/documents`;

        console.log("Fetching documents list...");
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();

        if (data.documents) {
            console.log(`SUCCESS! Found ${data.documents.length} documents.`);
            fs.writeFileSync('docs_dump.json', JSON.stringify(data.documents, null, 2));
            console.log("Documents detailed dump written to docs_dump.json");
        } else {
            console.log("No documents found in this Data Store.");
            console.log("Raw Response:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
