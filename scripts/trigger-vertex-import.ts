
import { GoogleAuth } from 'google-auth-library';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function triggerImport() {
    console.log('Triggering Vertex AI Search Import...');

    const project = process.env.GCP_PROJECT_ID;
    const location = 'global';
    const collection = 'default_collection';
    const datastoreId = process.env.GCP_VERTEX_DATASTORE_ID;
    const bucketName = process.env.GCP_STORAGE_BUCKET || 'owlight';
    const gcsUri = `gs://${bucketName}/knowledge/*.json`; // Import all JSONs

    if (!project || !datastoreId) {
        console.error('Missing GCP environment variables');
        process.exit(1);
    }

    const auth = new GoogleAuth({
        keyFilename: path.join(process.cwd(), 'gcp-key.json'),
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    const branchName = `projects/${project}/locations/${location}/collections/${collection}/dataStores/${datastoreId}/branches/0`;
    const endpoint = `https://discoveryengine.googleapis.com/v1beta/${branchName}/documents:import`;

    console.log(`Target Branch: ${branchName}`);
    console.log(`Source URI: ${gcsUri}`);

    const body = {
        gcsSource: {
            inputUris: [gcsUri],
            dataSchema: "content" // unstructured with metadata
        },
        reconciliationMode: "INCREMENTAL"
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} ${err}`);
        }

        const data = await response.json();
        console.log('Import Job Started Successfully!');
        console.log('Operation Name:', data.name);
        console.log('Please verify in GCP Console > Agent Builder > Activity');

    } catch (error) {
        console.error('Import Failed:', error);
    }
}

triggerImport();
