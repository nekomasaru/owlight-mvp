import { container } from '@/src/di/container';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const userId = searchParams.get('userId');

    try {
        let results;

        if (!q.trim()) {
            // Fallback to Supabase for initial load (recent items)
            const allDocs = await container.knowledgeRepository.searchKnowledge('', 20);

            // Map with async data (Favorite check)
            results = await Promise.all(allDocs.map(async (doc) => ({
                id: doc.id,
                title: doc.title || '現場の知恵',
                content: doc.content,
                score: doc.helpfulnessCount || 0,
                viewCount: doc.viewCount || 0,
                tags: doc.tags || [],
                author: doc.createdBy,
                trustTier: doc.trustTier,
                isFavorite: userId ? await container.knowledgeRepository.isFavorite(userId, doc.id!) : false
            })));
        } else {
            // Use Vertex AI Search
            const searchResponse = await container.searchService.search(q);

            results = await Promise.all(searchResponse.citations.map(async (c: any) => {
                // Fetch extra data from Supabase for engagement metrics
                let viewCount = 0;
                let isFavorite = false;

                if (c.id) {
                    const doc = await container.knowledgeRepository.getKnowledge(c.id);
                    if (doc) {
                        viewCount = doc.viewCount || 0;
                        if (userId) {
                            isFavorite = await container.knowledgeRepository.isFavorite(userId, c.id);
                        }
                    }
                }

                return {
                    id: c.id,
                    title: c.title,
                    content: c.contentSnippet,
                    score: 80,
                    viewCount,
                    isFavorite,
                    tags: [],
                    author: c.author || 'AI Search',
                    trustTier: c.trustTier || 3
                };
            }));
        }

        return new Response(JSON.stringify({ query: q, results }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Search Error:", error);
        // Fallback to Supabase on error? Or just return error
        return new Response(JSON.stringify({ error: "Search failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
