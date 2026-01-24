
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
const engineId = envConfig.GCP_VERTEX_APP_ID;

async function test() {
    const auth = new GoogleAuth({
        keyFilename: './gcp-key.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    try {
        const client = await auth.getClient();
        const tokenResponse = await client.getAccessToken();
        const accessToken = tokenResponse.token;

        const servingConfig = `projects/${project}/locations/global/collections/default_collection/engines/${engineId}/servingConfigs/default_serving_config`;
        const endpoint = `https://discoveryengine.googleapis.com/v1beta/${servingConfig}:answer`;

        console.log(`Searching with Engine: ${engineId}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: { text: "情報公開" }
            })
        });

        const data = await response.json();
        fs.writeFileSync('search_result.json', JSON.stringify(data, null, 2));
        console.log("Written response to search_result.json");

        if (data.answer) {
            console.log("Answer found.");
            console.log("Snippet:", data.answer.answerText);
        } else {
            console.log("No answer field.");
        }

    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
