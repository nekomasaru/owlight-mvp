
import { container } from '../src/di/container';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function debugVertex() {
    const query = "情報公開における不開示情報の種類は何種類ありますか？";
    // @ts-ignore - access internal client for debugging
    const service = container.searchService;
    const client = service.client;
    const servingConfig = service.client.projectLocationCollectionDataStoreServingConfigPath(
        service.projectId,
        service.location,
        service.collectionId,
        service.dataStoreId,
        'default_search'
    );

    console.log(`Query: ${query}`);
    console.log(`Config: ${servingConfig}`);

    try {
        const request = {
            pageSize: 20, // Check if we can get more than 5
            query: query,
            servingConfig: servingConfig,
            contentSearchSpec: {
                snippetSpec: { returnSnippet: true },
                summarySpec: {
                    summaryResultCount: 1,
                    includeCitations: true,
                    ignoreAdversarialQuery: true,
                    modelSpec: { version: 'stable' }
                }
            }
        };

        console.log('\n--- Requesting with summarySpec ---');
        const [results, nextRequest, response] = await client.search(request, { autoPaginate: false });

        console.log(`Results Array length: ${results?.length}`);
        console.log(`Unpacked response object has summary: ${!!response?.summary}`);
        if (response?.summary) {
            console.log(`Summary Text: ${response.summary.summaryText}`);
        }

        console.log('\nTop 3 Result Titles:');
        results.slice(0, 3).forEach((r: any, i: number) => {
            console.log(`${i + 1}. ${r.document?.derivedStructData?.title || r.document?.id}`);
        });

        // Test without summarySpec
        console.log('\n--- Requesting WITHOUT summarySpec ---');
        const req2 = { ...request, contentSearchSpec: { snippetSpec: { returnSnippet: true } } };
        const [results2] = await client.search(req2, { autoPaginate: false });
        console.log(`Results Array length (without summarySpec): ${results2?.length}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

debugVertex();
