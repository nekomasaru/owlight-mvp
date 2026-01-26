import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// GET /api/chat/sessions?userId=xxx - Get chat sessions for a user
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const sessionId = searchParams.get('sessionId');

        if (!userId && !sessionId) {
            return NextResponse.json({ error: 'userId or sessionId is required' }, { status: 400 });
        }

        if (sessionId) {
            // Get messages for a session
            const messages = await container.knowledgeRepository.getChatMessages(sessionId);
            return NextResponse.json({ messages });
        } else {
            // Get sessions for a user
            const limit = parseInt(searchParams.get('limit') || '20');
            const offset = parseInt(searchParams.get('offset') || '0');
            const sessions = await container.knowledgeRepository.getChatSessions(userId!, limit, offset);
            return NextResponse.json({ sessions });
        }
    } catch (error) {
        console.error('Error fetching chat data:', error);
        return NextResponse.json({ error: 'Failed to fetch chat data' }, { status: 500 });
    }
}

// POST /api/chat/sessions - Create a new chat session or send a message
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, userId, sessionId, title, message } = body;

        if (action === 'createSession') {
            if (!userId) {
                return NextResponse.json({ error: 'userId is required' }, { status: 400 });
            }
            const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const session = await container.knowledgeRepository.getOrCreateChatSession(
                newSessionId,
                userId,
                title || '新しい会話'
            );
            return NextResponse.json({ session });
        }

        if (action === 'sendMessage') {
            if (!sessionId || !message) {
                return NextResponse.json({ error: 'sessionId and message are required' }, { status: 400 });
            }
            await container.knowledgeRepository.saveChatMessage({
                sessionId,
                role: message.role,
                content: message.content,
                citations: message.citations
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in chat sessions:', error);
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
    }
}

// PATCH /api/chat/sessions - Update session title
export async function PATCH(req: NextRequest) {
    try {
        const { sessionId, title } = await req.json();

        if (!sessionId || !title) {
            return NextResponse.json({ error: 'sessionId and title are required' }, { status: 400 });
        }

        await container.knowledgeRepository.updateChatSessionTitle(sessionId, title);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating chat session:', error);
        return NextResponse.json({ error: 'Failed to update chat session' }, { status: 500 });
    }
}

// DELETE /api/chat/sessions?sessionId=xxx - Delete a chat session
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        await container.knowledgeRepository.deleteChatSession(sessionId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 });
    }
}
