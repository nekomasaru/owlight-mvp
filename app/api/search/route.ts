import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const lowerQ = q.toLowerCase();

    try {
        // MVP: Fetch recent 50 items and filter in memory
        // (For production, use Algolia/Elasticsearch or Vector DB)
        const qRef = query(collection(db, 'knowledge'), orderBy('points', 'desc'), limit(50));
        const snapshot = await getDocs(qRef);

        const allDocs = snapshot.docs.map(doc => ({
            id: doc.id,
            title: doc.data().tags?.[0] || '現場の知恵', // Use first tag or default
            content: doc.data().content,
            score: doc.data().points || 0,
            tags: doc.data().tags || [],
            author: doc.data().author
        }));

        // In-memory Filter
        const results = allDocs.filter(doc =>
            doc.content.toLowerCase().includes(lowerQ) ||
            doc.tags.some((t: string) => t.toLowerCase().includes(lowerQ))
        );

        return new Response(JSON.stringify({ query: q, results }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error("Search Error:", error);
        return new Response(JSON.stringify({ error: "Search failed" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
