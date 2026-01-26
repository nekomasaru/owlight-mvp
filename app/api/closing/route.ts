import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/closing - Save a closing log
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, reflection, accomplishments, tomorrowGoals, gratitudeTo, gratitudeMessage } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        await container.knowledgeRepository.saveClosingLog({
            userId,
            reflection,
            accomplishments,
            tomorrowGoals,
            gratitudeTo,
            gratitudeMessage
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving closing log:', error);
        return NextResponse.json({ error: 'Failed to save closing log' }, { status: 500 });
    }
}

// GET /api/closing?userId=xxx - Get closing logs for a user
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const logs = await container.knowledgeRepository.getClosingLogs(userId, limit);
        return NextResponse.json({ logs });
    } catch (error) {
        console.error('Error fetching closing logs:', error);
        return NextResponse.json({ error: 'Failed to fetch closing logs' }, { status: 500 });
    }
}
