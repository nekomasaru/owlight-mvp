export type User = {
  name: string;
  points: number;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};
