import {
    KnowledgeRecord,
    DomainUser,
    ChatSession,
    ChatMessage,
    ClosingLog,
    DailyReflection,
    SystemPrompt,
    KnowledgeFeedback,
    DomainNotification
} from '../types';

export interface IKnowledgeRepository {
    // ============================================================
    // User Management
    // ============================================================

    /**
     * Get a user by ID
     */
    getUser(userId: string): Promise<DomainUser | null>;

    /**
     * Get all users
     */
    getAllUsers(): Promise<DomainUser[]>;

    /**
     * Create or update a user
     */
    saveUser(user: Partial<DomainUser> & { id: string }): Promise<void>;

    /**
     * Delete a user
     */
    deleteUser(userId: string): Promise<void>;

    /**
     * Update a user partially
     */
    updateUser(userId: string, updates: Partial<DomainUser>): Promise<void>;

    /**
     * Award points and thanks to users
     */
    awardPoints(userIds: string[], points: number, thanks: number): Promise<void>;

    // ============================================================
    // Knowledge Management
    // ============================================================

    /**
     * Save a new knowledge record
     */
    saveKnowledge(record: Omit<KnowledgeRecord, 'id'>): Promise<string>;

    /**
     * Get a knowledge record by ID
     */
    getKnowledge(id: string): Promise<KnowledgeRecord | null>;

    /**
     * Search knowledge by text query
     */
    searchKnowledge(query: string, limit?: number): Promise<KnowledgeRecord[]>;

    /**
     * Get top/featured knowledge for display
     */
    getTopKnowledge(limit: number): Promise<KnowledgeRecord[]>;

    /**
     * Approve a knowledge record
     */
    approveKnowledge(id: string, approverId: string): Promise<void>;

    /**
     * Update a knowledge record
     */
    updateKnowledge(id: string, updates: Partial<KnowledgeRecord>): Promise<void>;

    /**
     * Delete a knowledge record
     */
    deleteKnowledge(id: string): Promise<void>;

    /**
     * Submit feedback for knowledge
     */
    submitFeedback(feedback: Omit<KnowledgeFeedback, 'id'>): Promise<void>;

    /**
     * Increment view count for a knowledge record
     */
    incrementViewCount(id: string): Promise<void>;

    /**
     * Toggle favorite status
     */
    toggleFavorite(userId: string, knowledgeId: string): Promise<boolean>;

    /**
     * Check if favorite
     */
    isFavorite(userId: string, knowledgeId: string): Promise<boolean>;

    /**
     * Get IDs of users who favorited this knowledge
     */
    getFavoritedUserIds(knowledgeId: string): Promise<string[]>;

    // ============================================================
    // System Prompts
    // ============================================================

    /**
     * Get a system prompt by ID
     */
    getPrompt(id: string): Promise<string | null>;

    /**
     * Save or update a system prompt
     */
    savePrompt(id: string, content: string, description?: string): Promise<void>;

    // ============================================================
    // Chat History
    // ============================================================

    /**
     * Get chat sessions for a user
     */
    getChatSessions(userId: string, limit?: number, offset?: number): Promise<ChatSession[]>;

    /**
     * Get or create a chat session
     */
    getOrCreateChatSession(sessionId: string, userId: string, title?: string): Promise<ChatSession>;

    /**
     * Get messages for a chat session
     */
    getChatMessages(sessionId: string): Promise<ChatMessage[]>;

    /**
     * Save a chat message
     */
    saveChatMessage(message: Omit<ChatMessage, 'id'>): Promise<void>;

    /**
     * Update chat session title
     */
    updateChatSessionTitle(sessionId: string, title: string): Promise<void>;

    /**
     * Delete a chat session and all its messages
     */
    deleteChatSession(sessionId: string): Promise<void>;

    // ============================================================
    // Closing Logs
    // ============================================================

    /**
     * Save a closing log (daily reflection)
     */
    saveClosingLog(log: Omit<ClosingLog, 'id'>): Promise<void>;

    /**
     * Get closing logs for a user
     */
    getClosingLogs(userId: string, limit?: number): Promise<ClosingLog[]>;

    // ============================================================
    // Daily Reflections (Closed Loop Ritual)
    // ============================================================

    /**
     * Save a daily reflection with metrics snapshot
     */
    saveDailyReflection(reflection: Omit<DailyReflection, 'id'>): Promise<void>;

    /**
     * Get latest daily reflections for a user (for Morning Ritual display)
     */
    getLatestDailyReflections(userId: string, limit?: number): Promise<DailyReflection[]>;

    // ============================================================
    // Notifications
    // ============================================================

    /**
     * Create a notification
     */
    createNotification(notification: Omit<DomainNotification, 'id' | 'isRead' | 'createdAt'>): Promise<void>;

    /**
     * Get notifications for a user
     */
    getNotifications(userId: string, limit?: number): Promise<DomainNotification[]>;

    /**
     * Mark notification as read
     */
    markNotificationAsRead(notificationId: string): Promise<void>;
}
