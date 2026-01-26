import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/knowledge/view?id=xxx
export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await container.knowledgeRepository.incrementViewCount(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error incrementing view count:', error);
        return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 });
    }
}
