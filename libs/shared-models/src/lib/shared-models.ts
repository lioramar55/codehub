export function sharedModels(): string {
  return 'shared-models';
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot?: boolean;
}

export interface Message {
  id: string;
  author: User;
  content: string;
  createdAt: string;
}

export interface SystemMessage {
  id: string;
  kind: 'join' | 'leave' | 'info';
  user: Pick<User, 'id' | 'name'>;
  createdAt: string;
}
