
const { DocumentServiceClient } = require('@google-cloud/discoveryengine');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function listDocuments() {
    const projectId = process.env.GCP_PROJECT_ID;
    const location = 'global';
    const collectionId = 'default_collection';
    const dataStoreId = process.env.GCP_VERTEX_DATASTORE_ID;

    if (!projectId || !dataStoreId) {
        console.error('Missing configuration variables.');
        return;
    }

    const client = new DocumentServiceClient({
        keyFilename: path.join(__dirname, '../service-account.json')
    });

    const parent = client.projectLocationCollectionDataStoreBranchPath(
        projectId,
        location,
        collectionId,
        dataStoreId,
        'default_branch'
    );

    console.log(`Listing documents in: ${parent}`);

    try {
        const [response] = await client.listDocuments({
            parent: parent,
            pageSize: 10
        });

        console.log('List Documents Response received.');
        if (response) {
            console.log(`Found ${response.length} documents.`);
            response.forEach((doc, i) => {
                console.log(`[${i + 1}] ID: ${doc.id}`);
                console.log(`      Title: ${doc.jsonData ? JSON.parse(doc.jsonData).title : (doc.derivedStructData?.title || 'N/A')}`);
                console.log(`      URI: ${doc.content?.uri || 'N/A'}`);
            });
        } else {
            console.log('No documents found.');
        }

    } catch (error) {
        console.error('Error listing documents:', error);
    }
}

listDocuments();
