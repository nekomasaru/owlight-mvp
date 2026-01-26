import { IKnowledgeRepository } from '../domain/interfaces/IKnowledgeRepository';
import {
    KnowledgeRecord,
    DomainUser,
    ChatSession,
    ChatMessage,
    ClosingLog,
    DailyReflection,
    KnowledgeFeedback,
    TrustTier,
    ApprovalStatus,
    SourceType,
    Visibility,
    DomainNotification
} from '../domain/types';
import { supabase } from '../lib/supabase';

export class SupabaseKnowledgeRepository implements IKnowledgeRepository {

    // ============================================================
    // User Management
    // ============================================================

    async getUser(userId: string): Promise<DomainUser | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !data) return null;
        return this.mapUserFromDb(data);
    }

    async getAllUsers(): Promise<DomainUser[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('name');

        if (error || !data) return [];
        return data.map(u => this.mapUserFromDb(u));
    }

    async saveUser(user: Partial<DomainUser> & { id: string }): Promise<void> {
        const dbUser = {
            id: user.id,
            name: user.name,
            department: user.department,
            role: user.role,
            stamina: user.stamina,
            max_stamina: user.maxStamina,
            mentor_mode: user.mentorMode,
            points: user.points,
            thanks_count: user.thanksCount,
            time_saved_minutes: user.timeSaved,
            avatar_url: user.avatarUrl,
            sidebar_collapsed: user.sidebarCollapsed,
            focus_mode: user.focusMode,
            pending_notifications: user.pendingNotifications,
            theme: user.theme
        };

        const { error } = await supabase
            .from('users')
            .upsert(dbUser, { onConflict: 'id' });

        if (error) throw error;
    }

    async updateUser(userId: string, updates: Partial<DomainUser>): Promise<void> {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.department !== undefined) dbUpdates.department = updates.department;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.stamina !== undefined) dbUpdates.stamina = updates.stamina;
        if (updates.maxStamina !== undefined) dbUpdates.max_stamina = updates.maxStamina;
        if (updates.mentorMode !== undefined) dbUpdates.mentor_mode = updates.mentorMode;
        if (updates.points !== undefined) dbUpdates.points = updates.points;
        if (updates.thanksCount !== undefined) dbUpdates.thanks_count = updates.thanksCount;
        if (updates.timeSaved !== undefined) dbUpdates.time_saved_minutes = updates.timeSaved;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
        if (updates.sidebarCollapsed !== undefined) dbUpdates.sidebar_collapsed = updates.sidebarCollapsed;
        if (updates.focusMode !== undefined) dbUpdates.focus_mode = updates.focusMode;
        if (updates.pendingNotifications !== undefined) dbUpdates.pending_notifications = updates.pendingNotifications;
        if (updates.theme !== undefined) dbUpdates.theme = updates.theme;

        const { error } = await supabase
            .from('users')
            .update(dbUpdates)
            .eq('id', userId);

        if (error) throw error;
    }

    async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }

    async awardPoints(userIds: string[], points: number, thanks: number): Promise<void> {
        for (const id of userIds) {
            const { data: user } = await supabase
                .from('users')
                .select('points, thanks_count')
                .eq('id', id)
                .single();

            if (user) {
                await supabase
                    .from('users')
                    .update({
                        points: (user.points || 0) + points,
                        thanks_count: (user.thanks_count || 0) + thanks
                    })
                    .eq('id', id);
            }
        }
    }

    // ============================================================
    // Knowledge Management
    // ============================================================

    async saveKnowledge(record: Omit<KnowledgeRecord, 'id'>): Promise<string> {
        const dbRecord = {
            title: record.title,
            content: record.content,
            category: record.category,
            trust_tier: record.trustTier,
            source_type: record.sourceType,
            visibility: record.visibility,
            department_id: record.departmentId,
            law_reference: record.lawReference,
            law_reference_url: record.lawReferenceUrl,
            created_by: record.createdBy,
            contributors: record.contributors,
            approver_id: record.approverId,
            approval_status: record.approvalStatus,
            helpfulness_count: record.helpfulnessCount || 0,
            tags: record.tags,
            structured_data: record.structuredData
        };

        const { data, error } = await supabase
            .from('knowledge_base')
            .insert(dbRecord)
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    async getKnowledge(id: string): Promise<KnowledgeRecord | null> {
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return this.mapKnowledgeFromDb(data);
    }

    async searchKnowledge(query: string, limit: number = 20): Promise<KnowledgeRecord[]> {
        // Simple text search using ilike
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
            .eq('approval_status', 'approved')
            .order('helpfulness_count', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data.map(k => this.mapKnowledgeFromDb(k));
    }

    async getTopKnowledge(limit: number): Promise<KnowledgeRecord[]> {
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('approval_status', 'approved')
            .order('trust_tier', { ascending: true }) // Gold first
            .order('helpfulness_count', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data.map(k => this.mapKnowledgeFromDb(k));
    }

    async approveKnowledge(id: string, approverId: string): Promise<void> {
        const { error } = await supabase
            .from('knowledge_base')
            .update({
                approval_status: 'approved',
                approver_id: approverId,
                approved_at: new Date().toISOString(),
                synced_to_vertex: false // Mark for re-sync
            })
            .eq('id', id);

        if (error) throw error;
    }

    async updateKnowledge(id: string, updates: Partial<KnowledgeRecord>): Promise<void> {
        const dbUpdates: any = {};

        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.content !== undefined) dbUpdates.content = updates.content;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.trustTier !== undefined) dbUpdates.trust_tier = updates.trustTier;
        if (updates.sourceType !== undefined) dbUpdates.source_type = updates.sourceType;
        if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
        if (updates.lawReference !== undefined) dbUpdates.law_reference = updates.lawReference;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
        if (updates.structuredData !== undefined) dbUpdates.structured_data = updates.structuredData;

        // Mark for re-sync if content changed
        if (updates.title || updates.content) {
            dbUpdates.synced_to_vertex = false;
        }

        const { error } = await supabase
            .from('knowledge_base')
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
    }

    async deleteKnowledge(id: string): Promise<void> {
        const { error } = await supabase
            .from('knowledge_base')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async submitFeedback(feedback: Omit<KnowledgeFeedback, 'id'>): Promise<void> {
        const { error } = await supabase
            .from('knowledge_feedback')
            .upsert({
                knowledge_id: feedback.knowledgeId,
                user_id: feedback.userId,
                helpful: feedback.helpful,
                feedback_text: feedback.feedbackText
            }, { onConflict: 'knowledge_id,user_id' });

        if (error) throw error;

        // Update helpfulness count
        if (feedback.helpful) {
            const { data: knowledge } = await supabase
                .from('knowledge_base')
                .select('helpfulness_count')
                .eq('id', feedback.knowledgeId)
                .single();

            if (knowledge) {
                await supabase
                    .from('knowledge_base')
                    .update({ helpfulness_count: (knowledge.helpfulness_count || 0) + 1 })
                    .eq('id', feedback.knowledgeId);
            }
        }
    }

    async incrementViewCount(id: string): Promise<void> {
        const { data: knowledge } = await supabase
            .from('knowledge_base')
            .select('view_count')
            .eq('id', id)
            .single();

        if (knowledge) {
            await supabase
                .from('knowledge_base')
                .update({ view_count: (knowledge.view_count || 0) + 1 })
                .eq('id', id);
        }
    }

    async toggleFavorite(userId: string, knowledgeId: string): Promise<boolean> {
        const { data: existing } = await supabase
            .from('knowledge_favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('knowledge_id', knowledgeId)
            .single();

        if (existing) {
            await supabase
                .from('knowledge_favorites')
                .delete()
                .eq('user_id', userId)
                .eq('knowledge_id', knowledgeId);
            return false;
        } else {
            await supabase
                .from('knowledge_favorites')
                .insert({ user_id: userId, knowledge_id: knowledgeId });
            return true;
        }
    }

    async isFavorite(userId: string, knowledgeId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('knowledge_favorites')
            .select('*')
            .eq('user_id', userId)
            .eq('knowledge_id', knowledgeId)
            .single();

        return !!data && !error;
    }

    async getFavoritedUserIds(knowledgeId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('knowledge_favorites')
            .select('user_id')
            .eq('knowledge_id', knowledgeId);

        if (error || !data) return [];
        return data.map(f => f.user_id);
    }

    // ============================================================
    // System Prompts
    // ============================================================

    async getPrompt(id: string): Promise<string | null> {
        const { data, error } = await supabase
            .from('prompts')
            .select('content')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data.content;
    }

    async savePrompt(id: string, content: string, description?: string): Promise<void> {
        const { error } = await supabase
            .from('prompts')
            .upsert({
                id,
                content,
                description
            }, { onConflict: 'id' });

        if (error) throw error;
    }

    // ============================================================
    // Chat History
    // ============================================================

    async getChatSessions(userId: string, limit?: number, offset?: number): Promise<ChatSession[]> {
        let query = supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (limit !== undefined && offset !== undefined) {
            query = query.range(offset, offset + limit - 1);
        } else if (limit !== undefined) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error || !data) return [];
        return data.map(s => ({
            id: s.id,
            userId: s.user_id,
            title: s.title,
            model: s.model,
            createdAt: s.created_at,
            updatedAt: s.updated_at
        }));
    }

    async getOrCreateChatSession(sessionId: string, userId: string, title?: string): Promise<ChatSession> {
        // Try to get existing session
        const { data: existing } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

        if (existing) {
            return {
                id: existing.id,
                userId: existing.user_id,
                title: existing.title,
                model: existing.model,
                createdAt: existing.created_at,
                updatedAt: existing.updated_at
            };
        }

        // Create new session
        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({
                id: sessionId,
                user_id: userId,
                title: title || '新しい会話'
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            model: data.model,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    }

    async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error || !data) return [];
        return data.map(m => ({
            id: m.id,
            sessionId: m.session_id,
            role: m.role,
            content: m.content,
            citations: m.citations,
            createdAt: m.created_at
        }));
    }

    async saveChatMessage(message: Omit<ChatMessage, 'id'>): Promise<void> {
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                session_id: message.sessionId,
                role: message.role,
                content: message.content,
                citations: message.citations
            });

        if (error) throw error;

        // Update session's updated_at
        await supabase
            .from('chat_sessions')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', message.sessionId);
    }

    async updateChatSessionTitle(sessionId: string, title: string): Promise<void> {
        const { error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', sessionId);

        if (error) throw error;
    }

    async deleteChatSession(sessionId: string): Promise<void> {
        // Messages are deleted automatically via cascade
        const { error } = await supabase
            .from('chat_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
    }

    // ============================================================
    // Closing Logs
    // ============================================================

    async saveClosingLog(log: Omit<ClosingLog, 'id'>): Promise<void> {
        const { error } = await supabase
            .from('closing_logs')
            .insert({
                user_id: log.userId,
                reflection: log.reflection,
                accomplishments: log.accomplishments,
                tomorrow_goals: log.tomorrowGoals,
                gratitude_to: log.gratitudeTo,
                gratitude_message: log.gratitudeMessage
            });

        if (error) throw error;
    }

    async getClosingLogs(userId: string, limit: number = 10): Promise<ClosingLog[]> {
        const { data, error } = await supabase
            .from('closing_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data.map(l => ({
            id: l.id,
            userId: l.user_id,
            reflection: l.reflection,
            accomplishments: l.accomplishments,
            tomorrowGoals: l.tomorrow_goals,
            gratitudeTo: l.gratitude_to,
            gratitudeMessage: l.gratitude_message,
            createdAt: l.created_at
        }));
    }

    // ============================================================
    // Notifications
    // ============================================================

    async createNotification(notification: Omit<DomainNotification, 'id' | 'isRead' | 'createdAt'>): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: notification.userId,
                type: notification.type,
                title: notification.title,
                body: notification.body,
                link_url: notification.linkUrl,
                is_read: false
            });

        if (error) throw error;
    }

    async getNotifications(userId: string, limit: number = 20): Promise<DomainNotification[]> {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data.map(n => ({
            id: n.id,
            userId: n.user_id,
            type: n.type,
            title: n.title,
            body: n.body,
            linkUrl: n.link_url,
            isRead: n.is_read,
            createdAt: n.created_at
        }));
    }

    async markNotificationAsRead(notificationId: string): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
    }

    // ============================================================
    // Daily Reflections (Closed Loop Ritual)
    // ============================================================

    async saveDailyReflection(reflection: Omit<DailyReflection, 'id'>): Promise<void> {
        const { error } = await supabase
            .from('daily_reflections')
            .insert({
                user_id: reflection.userId,
                reflection_text: reflection.reflectionText,
                reflection_type: reflection.reflectionType,
                metrics_snapshot: reflection.metricsSnapshot
            });

        if (error) throw error;
    }

    async getLatestDailyReflections(userId: string, limit: number = 2): Promise<DailyReflection[]> {
        const { data, error } = await supabase
            .from('daily_reflections')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data) return [];
        return data.map(r => ({
            id: r.id,
            userId: r.user_id,
            reflectionText: r.reflection_text,
            reflectionType: r.reflection_type,
            metricsSnapshot: r.metrics_snapshot || { points: 0, thanks: 0, timeSaved: 0 },
            createdAt: r.created_at
        }));
    }

    // ============================================================
    // Helper Methods
    // ============================================================

    private mapUserFromDb(data: any): DomainUser {
        return {
            id: data.id,
            name: data.name,
            role: data.role,
            department: data.department,
            points: data.points || 0,
            stamina: data.stamina || 100,
            maxStamina: data.max_stamina || 100,
            mentorMode: data.mentor_mode || false,
            timeSaved: data.time_saved_minutes || 0,
            thanksCount: data.thanks_count || 0,
            avatarUrl: data.avatar_url,
            sidebarCollapsed: data.sidebar_collapsed || false,
            focusMode: data.focus_mode || false,
            pendingNotifications: data.pending_notifications || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            theme: data.theme as 'light' | 'dark' | undefined
        };
    }

    private mapKnowledgeFromDb(data: any): KnowledgeRecord {
        return {
            id: data.id,
            title: data.title,
            content: data.content,
            category: data.category,
            trustTier: data.trust_tier as TrustTier,
            sourceType: data.source_type as SourceType,
            visibility: data.visibility as Visibility,
            departmentId: data.department_id,
            lawReference: data.law_reference,
            lawReferenceUrl: data.law_reference_url,
            createdBy: data.created_by,
            contributors: data.contributors,
            approverId: data.approver_id,
            approvalStatus: data.approval_status as ApprovalStatus,
            approvedAt: data.approved_at,
            helpfulnessCount: data.helpfulness_count || 0,
            viewCount: data.view_count || 0,
            tags: data.tags,
            structuredData: data.structured_data,
            syncedToVertex: data.synced_to_vertex,
            syncedAt: data.synced_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            deprecatedAt: data.deprecated_at,
            deprecationNote: data.deprecation_note
        };
    }
}
