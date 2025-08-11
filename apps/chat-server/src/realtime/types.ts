import { Socket } from 'socket.io';
import { User, ChatEvent, Room } from '@codehub/shared-models';

export interface SocketContext {
  socket: Socket;
  self: User | null;
  participants: User[];
  messageTimestamps: number[];
  currentRoomId: string;
}

export interface RoomJoinPayload {
  user: User;
  roomId: string;
}

export interface MessageSendPayload {
  author: User;
  content: string;
  roomId: string;
}

export interface TypingPayload {
  userId: string;
  roomId: string;
}

export interface RoomManager {
  addParticipant: (user: User, roomId: string) => void;
  removeParticipant: (userId: string, roomId: string) => void;
  getParticipants: (roomId: string) => User[];
  broadcastParticipants: (roomId: string) => void;
  getAllRooms: () => Promise<Room[]>;
  getRoomById: (roomId: string) => Promise<Room | null>;
}

export interface MessageManager {
  saveMessage: (message: ChatEvent) => Promise<void>;
  broadcastMessage: (message: ChatEvent) => void;
  sendMessageToSocket: (socket: any, message: ChatEvent) => void;
  createSystemMessage: (
    user: User,
    kind: 'join' | 'leave',
    roomId: string
  ) => ChatEvent;
  createUserMessage: (
    author: User,
    content: string,
    roomId: string
  ) => ChatEvent;
  createBotMessage: (content: string, roomId: string) => ChatEvent;
}
