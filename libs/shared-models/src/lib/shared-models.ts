export function sharedModels(): string {
  return 'shared-models';
}

export interface Room {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  isBot?: boolean;
}

export interface ChatEvent {
  id: string;
  type: 'user' | 'bot' | 'system';
  content?: string; // only for user/bot messages
  kind?: 'join' | 'leave' | 'info'; // only for system messages
  user?: User; // only for system messages
  createdAt: string;
  roomId?: string;
}
