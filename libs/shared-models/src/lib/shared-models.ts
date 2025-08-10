export function sharedModels(): string {
  return 'shared-models';
}

export interface User {
  id: string;
  name: string;
  isBot?: boolean;
}

export interface Message {
  id: string;
  roomId?: string;
  author: User;
  content: string;
  createdAt: Date;
}
