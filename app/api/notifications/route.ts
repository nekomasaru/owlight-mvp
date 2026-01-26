import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// GET /api/notifications?userId=xxx
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const notifications = await container.knowledgeRepository.getNotifications(userId, 50);

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// PATCH /api/notifications?id=xxx (mark as read)
export async function PATCH(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await container.knowledgeRepository.markNotificationAsRead(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
    }
}
