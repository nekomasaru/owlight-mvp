import { NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// GET /api/users - Get all users
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (id) {
            const user = await container.knowledgeRepository.getUser(id);
            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            return NextResponse.json({ user });
        }

        const users = await container.knowledgeRepository.getAllUsers();
        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST /api/users - Create or update a user
export async function POST(req: Request) {
    try {
        const user = await req.json();

        if (!user.id || !user.name) {
            return NextResponse.json({ error: 'id and name are required' }, { status: 400 });
        }

        await container.knowledgeRepository.saveUser(user);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving user:', error);
        return NextResponse.json({ error: 'Failed to save user' }, { status: 500 });
    }
}

// DELETE /api/users?id=xxx - Delete a user
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await container.knowledgeRepository.deleteUser(userId);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}

// PATCH /api/users - Update a user
export async function PATCH(req: Request) {
    try {
        const { id, ...updates } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // Convert camelCase to match repository expectations
        const mappedUpdates: any = { id };
        if (updates.name !== undefined) mappedUpdates.name = updates.name;
        if (updates.department !== undefined) mappedUpdates.department = updates.department;
        if (updates.role !== undefined) mappedUpdates.role = updates.role;
        if (updates.stamina !== undefined) mappedUpdates.stamina = updates.stamina;
        if (updates.maxStamina !== undefined) mappedUpdates.maxStamina = updates.maxStamina;
        if (updates.mentorMode !== undefined) mappedUpdates.mentorMode = updates.mentorMode;
        if (updates.points !== undefined) mappedUpdates.points = updates.points;
        if (updates.thanksCount !== undefined) mappedUpdates.thanksCount = updates.thanksCount;
        if (updates.timeSaved !== undefined) mappedUpdates.timeSaved = updates.timeSaved;
        if (updates.sidebarCollapsed !== undefined) mappedUpdates.sidebarCollapsed = updates.sidebarCollapsed;
        if (updates.focusMode !== undefined) mappedUpdates.focusMode = updates.focusMode;
        if (updates.pendingNotifications !== undefined) mappedUpdates.pendingNotifications = updates.pendingNotifications;
        if (updates.theme !== undefined) mappedUpdates.theme = updates.theme;

        await container.knowledgeRepository.updateUser(id, mappedUpdates);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
