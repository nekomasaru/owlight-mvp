export type UserRole = 'new_hire' | 'veteran' | 'manager';

export interface DomainUser {
    id: string;
    name: string;
    role: UserRole;
    department: string;
    points: number;
    stamina: number;
    mentorMode: boolean;
    timeSaved: number;
    thanksCount: number;
}

export interface Citation {
    id: string;
    title: string;
    author: string;
    authorId?: string;
    url?: string;
    contentSnippet?: string;
    score?: number;
}

export interface SearchResponse {
    answer: string;
    citations: Citation[];
}

export interface KnowledgeRecord {
    id?: string;
    userId: string;
    decisionType: string;
    title: string;
    summary: string;
    structuredData: any;
    isPublished: boolean;
    createdAt?: string;
    updatedAt?: string;
}
