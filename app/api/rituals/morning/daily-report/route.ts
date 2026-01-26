import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// GET /api/rituals/morning/daily-report - Get latest daily reflection for Morning Ritual display
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get the latest 2 reflections to calculate the diff
        const reflections = await container.knowledgeRepository.getLatestDailyReflections(userId, 2);

        if (reflections.length === 0) {
            // No reflections found - graceful fallback
            return NextResponse.json({
                hasReflection: false,
                message: 'No previous reflection found'
            });
        }

        const latest = reflections[0];
        const previous = reflections.length > 1 ? reflections[1] : null;

        // Calculate the diff (gains from yesterday)
        let gains = {
            points: latest.metricsSnapshot.points,
            thanks: latest.metricsSnapshot.thanks,
            timeSaved: latest.metricsSnapshot.timeSaved
        };

        if (previous) {
            gains = {
                points: latest.metricsSnapshot.points - previous.metricsSnapshot.points,
                thanks: latest.metricsSnapshot.thanks - previous.metricsSnapshot.thanks,
                timeSaved: latest.metricsSnapshot.timeSaved - previous.metricsSnapshot.timeSaved
            };
        }

        return NextResponse.json({
            hasReflection: true,
            reflection: {
                text: latest.reflectionText,
                type: latest.reflectionType,
                createdAt: latest.createdAt
            },
            gains
        });
    } catch (error) {
        console.error('Error fetching daily report:', error);
        return NextResponse.json({ error: 'Failed to fetch daily report' }, { status: 500 });
    }
}
