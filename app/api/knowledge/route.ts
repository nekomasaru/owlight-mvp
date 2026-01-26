import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';
import { syncAndImport } from '@/src/lib/knowledgeSync';

// GET /api/knowledge - Get knowledge list or single knowledge
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (id) {
            const knowledge = await container.knowledgeRepository.getKnowledge(id);
            return NextResponse.json({ knowledge });
        } else {
            const knowledge = await container.knowledgeRepository.getTopKnowledge(limit);
            return NextResponse.json({ knowledge });
        }
    } catch (error) {
        console.error('Error fetching knowledge:', error);
        return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
    }
}

// POST /api/knowledge - Create new knowledge
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, content, category, tags, createdBy, sourceType = 'user_submission' } = body;

        if (!content) {
            return NextResponse.json({ error: 'content is required' }, { status: 400 });
        }

        const knowledgeTitle = title || tags?.[0] || '現場の知恵';
        const trustTier = 3; // Bronze by default

        // 1. Save to Supabase
        const id = await container.knowledgeRepository.saveKnowledge({
            title: knowledgeTitle,
            content,
            category,
            tags,
            createdBy,
            trustTier,
            sourceType: sourceType as any,
            visibility: 'public',
            approvalStatus: 'approved',
            helpfulnessCount: 0
        });

        // 2. Sync to GCS and trigger Vertex AI Search import (async, non-blocking)
        syncAndImport({
            id,
            title: knowledgeTitle,
            content,
            trust_tier: trustTier,
            source_type: sourceType,
            category: category || 'general',
            tags: tags?.join(', '),
            author_id: createdBy,
            created_at: new Date().toISOString()
        }).then(result => {
            if (result.gcsSync.success) {
                console.log(`[/api/knowledge] GCS sync success for ${id}`);
            } else {
                console.error(`[/api/knowledge] GCS sync failed for ${id}:`, result.gcsSync.error);
            }
            if (result.vertexImport.success) {
                console.log(`[/api/knowledge] Vertex import triggered: ${result.vertexImport.operationName}`);
            } else {
                console.error(`[/api/knowledge] Vertex import failed:`, result.vertexImport.error);
            }
        }).catch(err => {
            console.error(`[/api/knowledge] Sync error:`, err);
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('Error creating knowledge:', error);
        return NextResponse.json({
            error: 'Failed to create knowledge',
            details: error.message
        }, { status: 500 });
    }
}

// PATCH /api/knowledge - Update knowledge
export async function PATCH(req: NextRequest) {
    try {
        const { id, content, tags, title, contributorId, ...rest } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        // Build update object
        const updates: any = {};
        if (content !== undefined) updates.content = content;
        if (tags !== undefined) updates.tags = tags;
        if (title !== undefined) updates.title = title;

        // Map other fields
        Object.assign(updates, rest);

        await container.knowledgeRepository.updateKnowledge(id, updates);

        // --- Notification Trigger ---
        try {
            const favoritedUserIds = await container.knowledgeRepository.getFavoritedUserIds(id);
            const knowledge = await container.knowledgeRepository.getKnowledge(id);

            if (knowledge && favoritedUserIds.length > 0) {
                // Remove self from notification list if contributorId is provided
                const targetUserIds = contributorId
                    ? favoritedUserIds.filter(uid => uid !== contributorId)
                    : favoritedUserIds;

                for (const userId of targetUserIds) {
                    await container.knowledgeRepository.createNotification({
                        userId,
                        type: 'knowledge_update',
                        title: 'お気に入り済みのナレッジが更新されました',
                        body: `「${knowledge.title}」が更新されました。確認してみましょう。`,
                        linkUrl: `/search?q=${encodeURIComponent(knowledge.title)}`
                    });
                }
            }
        } catch (notifError) {
            console.error('Failed to send update notifications:', notifError);
            // Don't fail the entire request for notification errors
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating knowledge:', error);
        return NextResponse.json({ error: 'Failed to update knowledge' }, { status: 500 });
    }
}

// DELETE /api/knowledge?id=xxx - Delete knowledge
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        await container.knowledgeRepository.deleteKnowledge(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting knowledge:', error);
        return NextResponse.json({ error: 'Failed to delete knowledge' }, { status: 500 });
    }
}
