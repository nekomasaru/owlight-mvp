// ============================================================
// Domain Types for OWLight
// ============================================================

// User Types
export type UserRole = 'admin' | 'reviewer' | 'contributor' | 'viewer';

export interface DomainUser {
    id: string;
    name: string;
    role: UserRole;
    department: string;
    points: number;
    stamina: number;
    maxStamina: number;
    mentorMode: boolean;
    timeSaved: number;
    thanksCount: number;
    avatarUrl?: string;
    sidebarCollapsed?: boolean;
    focusMode?: boolean;
    pendingNotifications?: any[];
    theme?: 'light' | 'dark';
    createdAt?: string;
    updatedAt?: string;
}

// Knowledge Types
export type TrustTier = 1 | 2 | 3; // 1=Gold, 2=Silver, 3=Bronze
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type SourceType = 'official' | 'mentor_validated' | 'user_submission';
export type Visibility = 'public' | 'same_department' | 'private';

export interface KnowledgeRecord {
    id?: string;
    title: string;
    content: string;
    category?: string;
    trustTier: TrustTier;
    sourceType: SourceType;
    visibility: Visibility;
    departmentId?: string;
    lawReference?: string;
    lawReferenceUrl?: string;
    createdBy?: string;
    contributors?: string[];
    approverId?: string;
    approvalStatus: ApprovalStatus;
    approvedAt?: string;
    helpfulnessCount: number;
    viewCount?: number;
    tags?: string[];
    structuredData?: any;
    syncedToVertex?: boolean;
    syncedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    deprecatedAt?: string;
    deprecationNote?: string;
}

// Citation and Search Types
export interface Citation {
    id: string;
    title: string;
    author: string;
    authorId?: string;
    url?: string;
    contentSnippet?: string;
    score?: number;
    trustTier?: TrustTier;
    sourceType?: SourceType;
}

export interface SearchResponse {
    answer: string;
    citations: Citation[];
}

// Chat Types
export interface ChatSession {
    id: string;
    userId: string;
    title: string;
    model?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChatMessage {
    id?: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    citations?: Citation[];
    createdAt?: string;
}

// Closing Log Types
export interface ClosingLog {
    id?: string;
    userId: string;
    reflection?: string;
    accomplishments?: string[];
    tomorrowGoals?: string[];
    gratitudeTo?: string;
    gratitudeMessage?: string;
    createdAt?: string;
}

// Daily Reflection Types (for Closed Loop Ritual)
export interface DailyReflectionMetrics {
    points: number;
    thanks: number;
    timeSaved: number;
}

export interface DailyReflection {
    id?: string;
    userId: string;
    reflectionText?: string;
    reflectionType: 'contribution' | 'hard_day' | 'neutral';
    metricsSnapshot: DailyReflectionMetrics;
    createdAt?: string;
}

// Prompt Types
export interface SystemPrompt {
    id: string;
    content: string;
    description?: string;
    updatedAt?: string;
}

// Knowledge Feedback
export interface KnowledgeFeedback {
    id?: string;
    knowledgeId: string;
    userId: string;
    helpful: boolean;
    feedbackText?: string;
    createdAt?: string;
}

// Notification Types
export interface DomainNotification {
    id?: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    linkUrl?: string;
    isRead: boolean;
    createdAt?: string;
}
