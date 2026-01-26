export type UserRole = 'new_hire' | 'veteran' | 'manager';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  points: number;
  stamina: number;
  mentorMode: boolean;
  timeSaved?: number;
  thanksCount?: number;
  sidebarCollapsed?: boolean;
  focusMode?: boolean;  // 集中モード - オンの間は通知を抑制
  pendingNotifications?: any[]; // 保留中の通知キュー
  theme?: 'light' | 'dark'; // テーマ設定
};

export type Citation = {
  id: string;
  author: string;
  authorId: string;
  contributors?: string[];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  isGeneralKnowledge?: boolean;
  knowledgeDraft?: {
    title: string;
    content: string;
    tags: string[];
  };
};
