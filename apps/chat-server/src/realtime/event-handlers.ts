import { Socket } from 'socket.io';
import { User, Room } from '@codehub/shared-models';
import { RoomManager } from './room-manager';
import { MessageManager } from './message-manager';
import { BotHandler } from './bot-service';
import { RoomJoinPayload, MessageSendPayload, TypingPayload } from './types';
import { createUser } from '../services/user.repository';

export class EventHandlers {
  private roomManager: RoomManager;
  private messageManager: MessageManager;
  private botHandler: BotHandler;

  constructor(
    roomManager: RoomManager,
    messageManager: MessageManager,
    botHandler: BotHandler
  ) {
    this.roomManager = roomManager;
    this.messageManager = messageManager;
    this.botHandler = botHandler;
  }

  async handleRoomJoin(
    socket: Socket,
    payload: RoomJoinPayload
  ): Promise<void> {
    const { user, roomId } = payload;

    // Verify room exists
    const room = await this.roomManager.getRoomById(roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    // Join the room
    socket.join(roomId);

    // Add participant and send room history
    await this.roomManager.addParticipant(user, roomId);
    await this.roomManager.sendRoomHistory(socket, roomId);

    // Create and broadcast join message
    const joinMessage = this.messageManager.createSystemMessage(
      user,
      'join',
      roomId
    );
    await this.messageManager.saveMessage(joinMessage);
    this.messageManager.broadcastMessage(joinMessage);
  }

  async handleRoomLeave(
    socket: Socket,
    user: User,
    roomId: string
  ): Promise<void> {
    if (!user) return;

    // Remove participant
    this.roomManager.removeParticipant(user.id, roomId);

    // Create and broadcast leave message
    const leaveMessage = this.messageManager.createSystemMessage(
      user,
      'leave',
      roomId
    );
    await this.messageManager.saveMessage(leaveMessage);
    this.messageManager.broadcastMessage(leaveMessage);

    // Leave the room
    socket.leave(roomId);
  }

  async handleDisconnect(
    socket: Socket,
    user: User,
    roomId: string
  ): Promise<void> {
    if (!user) return;

    // Remove participant
    this.roomManager.removeParticipant(user.id, roomId);

    // Create and broadcast disconnect message
    const disconnectMessage = this.messageManager.createSystemMessage(
      user,
      'leave',
      roomId
    );
    await this.messageManager.saveMessage(disconnectMessage);
    this.messageManager.broadcastMessage(disconnectMessage);
  }

  async handleMessageSend(
    socket: Socket,
    payload: MessageSendPayload
  ): Promise<void> {
    const { author, content, roomId } = payload;
    await this.botHandler.handleUserMessage(socket, author, content, roomId);
  }

  async createOrUpdateUser(payload: User): Promise<void> {
    await createUser(payload);
  }

  handleTypingStart(socket: Socket, payload: TypingPayload): void {
    socket.to(payload.roomId).emit('typing:start', { userId: payload.userId });
  }

  handleTypingStop(socket: Socket, payload: TypingPayload): void {
    socket.to(payload.roomId).emit('typing:stop', { userId: payload.userId });
  }

  async handleGetRooms(socket: Socket): Promise<void> {
    try {
      const rooms = await this.roomManager.getAllRooms();
      socket.emit('rooms:list', rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      socket.emit('error', { message: 'Failed to fetch rooms' });
    }
  }
}
