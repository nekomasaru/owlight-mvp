export type UserRole = 'new_hire' | 'veteran' | 'manager';

export type User = {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  points: number;
  stamina: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
};
