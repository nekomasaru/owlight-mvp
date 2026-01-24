import { IKnowledgeRepository } from '../domain/interfaces/IKnowledgeRepository';
import { KnowledgeRecord, DomainUser } from '../domain/types';
import { supabase } from '../lib/supabase';

export class SupabaseKnowledgeRepository implements IKnowledgeRepository {
    async saveKnowledge(record: KnowledgeRecord): Promise<string> {
        const { data, error } = await supabase
            .from('knowledge_logs')
            .insert({
                user_id: record.userId,
                decision_type: record.decisionType,
                title: record.title,
                summary: record.summary,
                structured_data: record.structuredData,
                is_published: record.isPublished
            })
            .select('id')
            .single();

        if (error) throw error;
        return data.id;
    }

    async getUserProfile(userId: string): Promise<DomainUser | null> {
        // Note: We need a 'profiles' or 'users' table in Supabase.
        // Assuming a 'profiles' table exists for now.
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return null;
        return {
            id: data.id,
            name: data.name,
            role: data.role,
            department: data.department,
            points: data.points,
            stamina: data.stamina,
            mentorMode: data.mentor_mode,
            timeSaved: data.time_saved,
            thanksCount: data.thanks_count
        };
    }

    async awardPoints(userIds: string[], points: number, thanks: number): Promise<void> {
        // Bulk update users in Supabase
        for (const id of userIds) {
            const { error } = await supabase.rpc('increment_user_stats', {
                user_id: id,
                point_inc: points,
                thanks_inc: thanks
            });
            if (error) {
                console.warn(`RPC 'increment_user_stats' failed for user ${id}. Falling back to fetch-and-update.`, error);

                // Fallback: Fetch current stats first
                const { data: user, error: fetchError } = await supabase
                    .from('profiles')
                    .select('points, thanks_count')
                    .eq('id', id)
                    .single();

                if (fetchError || !user) {
                    console.error(`Failed to fetch user ${id} for fallback update.`, fetchError);
                    continue;
                }

                // Update with new values
                await supabase
                    .from('profiles')
                    .update({
                        points: (user.points || 0) + points,
                        thanks_count: (user.thanks_count || 0) + thanks
                    })
                    .eq('id', id);
            }
        }
    }

    async getTopKnowledge(limitCount: number): Promise<KnowledgeRecord[]> {
        const { data, error } = await supabase
            .from('knowledge_logs')
            .select('*')
            .order('id', { ascending: false }) // Temporary sort, usually by points or popularity
            .limit(limitCount);

        if (error) throw error;
        return data.map(item => ({
            id: item.id,
            userId: item.user_id,
            decisionType: item.decision_type,
            title: item.title,
            summary: item.summary,
            structuredData: item.structured_data,
            isPublished: item.is_published,
            createdAt: item.created_at,
            updatedAt: item.updated_at
        }));
    }
}
