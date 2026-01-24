
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

console.log(`Starting Import for Data Store: ${dataStoreId}`);

async function importDocs() {
    const auth = new GoogleAuth({
        keyFilename: './gcp-key.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    try {
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const accessToken = tokenResponse.token;

        const endpoint = `https://discoveryengine.googleapis.com/v1beta/projects/${project}/locations/global/collections/default_collection/dataStores/${dataStoreId}/branches/0/documents:import`;

        const body = {
            gcsSource: {
                // Wildcard to catch everything just in case
                inputUris: [`gs://owlight/*`],
                dataSchema: "content"
            },
            reconciliationMode: "INCREMENTAL"
        };

        console.log("Triggering Import Job...");
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        fs.writeFileSync('import_log.json', JSON.stringify(data, null, 2));
        console.log("Response written to import_log.json");

    } catch (e) {
        console.error("Import failed:", e);
    }
}

importDocs();
