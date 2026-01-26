import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/src/di/container';

// POST /api/knowledge/feedback
export async function POST(req: NextRequest) {
    try {
        // 2. If helpful, award points to Authors & Contributors (Tributary Model)
        // Skip if skipPoints flag is set (e.g. for Copy action)
        if (helpful && !reqBody.skipPoints) {
            const targetUserIds = new Set<string>();

            // Add Creator (excluding self - already checked above, but safe to keep logic)
            if (knowledge.createdBy && knowledge.createdBy !== userId) {
                targetUserIds.add(knowledge.createdBy);
            }

            // Add Contributors (excluding self)
            if (Array.isArray(knowledge.contributors)) {
                knowledge.contributors.forEach(contributorId => {
                    if (contributorId && contributorId !== userId) {
                        targetUserIds.add(contributorId);
                    }
                });
            }

            // Award points to all unique targets
            if (targetUserIds.size > 0) {
                await knowledgeRepo.awardPoints(Array.from(targetUserIds), 10, 1);
            }
        }

        if (!knowledgeId || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const knowledgeRepo = container.knowledgeRepository;

        // 0. Check Ownership (Prevent Self-Praise)
        // Retrieve knowledge first to verify ownership
        const knowledge = await knowledgeRepo.getKnowledge(knowledgeId);

        if (knowledge) {
            // Check if user is Author or Contributor
            const isCreator = knowledge.createdBy === userId;
            const isContributor = Array.isArray(knowledge.contributors) && knowledge.contributors.includes(userId);

            if (isCreator || isContributor) {
                // If it's self-praise, return success but DO NOTHING (Prevent score manipulation)
                return NextResponse.json({ success: true, message: 'Self-feedback ignored' });
            }
        } else {
            return NextResponse.json({ error: 'Knowledge not found' }, { status: 404 });
        }

        // 1. Submit feedback (updates helpfulness_count)
        // Now safe to proceed
        await knowledgeRepo.submitFeedback({
            knowledgeId,
            userId,
            helpful,
            feedbackText: ''
        });

        // 2. If helpful, award points to Authors & Contributors (Tributary Model)
        if (helpful) {
            const targetUserIds = new Set<string>();

            // Add Creator (excluding self - already checked above, but safe to keep logic)
            if (knowledge.createdBy && knowledge.createdBy !== userId) {
                targetUserIds.add(knowledge.createdBy);
            }

            // Add Contributors (excluding self)
            if (Array.isArray(knowledge.contributors)) {
                knowledge.contributors.forEach(contributorId => {
                    if (contributorId && contributorId !== userId) {
                        targetUserIds.add(contributorId);
                    }
                });
            }

            // Award points to all unique targets
            if (targetUserIds.size > 0) {
                await knowledgeRepo.awardPoints(Array.from(targetUserIds), 10, 1);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Feedback submission error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
