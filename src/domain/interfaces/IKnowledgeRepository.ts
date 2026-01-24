import { KnowledgeRecord, DomainUser } from '../types';

export interface IKnowledgeRepository {
    /**
     * Saves a new knowledge log to the database.
     */
    saveKnowledge(record: KnowledgeRecord): Promise<string>;

    /**
     * Retrieves a user's profile and stats.
     */
    getUserProfile(userId: string): Promise<DomainUser | null>;

    /**
     * Awards points/thanks to a list of users (original author + contributors).
     */
    awardPoints(userIds: string[], points: number, thanks: number): Promise<void>;

    /**
     * Fetches high-ranking knowledge for initial display.
     */
    getTopKnowledge(limit: number): Promise<KnowledgeRecord[]>;
}
