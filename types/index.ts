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
};
