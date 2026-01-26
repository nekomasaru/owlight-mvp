import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/points - Award points and manage user engagement stats
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, userId, targetUserIds, points, thanks, stamina, timeSaved } = body;

        switch (action) {
            case 'awardPoints':
                // Award points to one or more users
                if (!targetUserIds || !Array.isArray(targetUserIds)) {
                    return NextResponse.json({ error: 'targetUserIds array is required' }, { status: 400 });
                }
                await container.knowledgeRepository.awardPoints(
                    targetUserIds,
                    points || 0,
                    thanks || 0
                );
                return NextResponse.json({ success: true });

            case 'updateStamina':
                // Update user stamina
                if (!userId || stamina === undefined) {
                    return NextResponse.json({ error: 'userId and stamina are required' }, { status: 400 });
                }
                await container.knowledgeRepository.saveUser({
                    id: userId,
                    stamina
                });
                return NextResponse.json({ success: true });

            case 'addTimeSaved':
                // Increment time saved
                if (!userId || !timeSaved) {
                    return NextResponse.json({ error: 'userId and timeSaved are required' }, { status: 400 });
                }
                const user = await container.knowledgeRepository.getUser(userId);
                if (user) {
                    await container.knowledgeRepository.saveUser({
                        id: userId,
                        timeSaved: (user.timeSaved || 0) + timeSaved
                    });
                }
                return NextResponse.json({ success: true });

            case 'consumeStamina':
                // Stamina system removed. Only update timeSaved.
                if (!userId) {
                    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
                }
                const currentUser = await container.knowledgeRepository.getUser(userId);
                if (currentUser) {
                    // Update timeSaved only, ignore stamina
                    await container.knowledgeRepository.saveUser({
                        id: userId,
                        timeSaved: (currentUser.timeSaved || 0) + (timeSaved || 1)
                    });
                }
                return NextResponse.json({ success: true });

            case 'recoverStamina':
                // Stamina system removed. Do nothing but return success for compatibility.
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error in points API:', error);
        return NextResponse.json({ error: 'Failed to process points request' }, { status: 500 });
    }
}
