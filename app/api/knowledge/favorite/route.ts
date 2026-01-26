import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/knowledge/favorite
export async function POST(req: NextRequest) {
    try {
        const { userId, knowledgeId } = await req.json();

        if (!userId || !knowledgeId) {
            return NextResponse.json({ error: 'userId and knowledgeId are required' }, { status: 400 });
        }

        const isFavorite = await container.knowledgeRepository.toggleFavorite(userId, knowledgeId);

        return NextResponse.json({ success: true, isFavorite });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
    }
}

// GET /api/knowledge/favorite?userId=xxx&knowledgeId=yyy
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const knowledgeId = searchParams.get('knowledgeId');

        if (!userId || !knowledgeId) {
            return NextResponse.json({ error: 'userId and knowledgeId are required' }, { status: 400 });
        }

        const isFavorite = await container.knowledgeRepository.isFavorite(userId, knowledgeId);

        return NextResponse.json({ isFavorite });
    } catch (error) {
        console.error('Error checking favorite:', error);
        return NextResponse.json({ error: 'Failed to check favorite' }, { status: 500 });
    }
}
