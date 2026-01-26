import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/rituals/closing - Save a daily reflection with metrics snapshot
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, reflectionText, reflectionType, metricsSnapshot } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        await container.knowledgeRepository.saveDailyReflection({
            userId,
            reflectionText: reflectionText || '',
            reflectionType: reflectionType || 'contribution',
            metricsSnapshot: metricsSnapshot || { points: 0, thanks: 0, timeSaved: 0 }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving daily reflection:', error);
        return NextResponse.json({ error: 'Failed to save daily reflection' }, { status: 500 });
    }
}
