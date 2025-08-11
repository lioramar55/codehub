import { Server } from 'socket.io';
import { User, ChatEvent } from '@codehub/shared-models';
import { BOT_CONSTANTS } from './constants';
import { saveMessage } from '../services/message.repository';

export class MessageManager {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async saveMessage(message: ChatEvent): Promise<void> {
    try {
      await saveMessage(message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  broadcastMessage(message: ChatEvent): void {
    if (message.roomId) {
      this.io.to(message.roomId).emit('message:new', message);
    }
  }

  sendMessageToSocket(socket: any, message: ChatEvent): void {
    socket.emit('message:new', message);
  }

  createSystemMessage(
    user: User,
    kind: 'join' | 'leave',
    roomId: string
  ): ChatEvent {
    return {
      id: crypto.randomUUID(),
      type: 'system',
      kind,
      user,
      roomId,
      createdAt: new Date().toISOString(),
    };
  }

  createUserMessage(author: User, content: string, roomId: string): ChatEvent {
    return {
      id: crypto.randomUUID(),
      user: author,
      content,
      createdAt: new Date().toISOString(),
      roomId,
      type: 'user',
    };
  }

  createBotMessage(content: string, roomId: string): ChatEvent {
    return {
      id: crypto.randomUUID(),
      user: BOT_CONSTANTS.NG_GURU,
      content,
      createdAt: new Date().toISOString(),
      roomId,
      type: 'bot',
    };
  }
}
