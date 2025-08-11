import { Server } from 'socket.io';
import { User, Room } from '@codehub/shared-models';
import { createUser } from '../services/user.repository';
import {
  createRoom,
  getAllRooms,
  getRoomById,
} from '../services/room.repository';
import { getRoomHistoryWithUser } from '../services/message.repository';

export class RoomManager {
  private participants: Map<string, User[]> = new Map(); // roomId -> participants[]
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  async addParticipant(user: User, roomId: string): Promise<void> {
    if (!this.participants.has(roomId)) {
      this.participants.set(roomId, []);
    }

    const roomParticipants = this.participants.get(roomId)!;
    roomParticipants.push(user);

    await this.upsertUserAndRoom(user, roomId);
    this.broadcastParticipants(roomId);
  }

  removeParticipant(userId: string, roomId: string): void {
    const roomParticipants = this.participants.get(roomId);
    if (roomParticipants) {
      this.participants.set(
        roomId,
        roomParticipants.filter((p) => p.id !== userId)
      );
      this.broadcastParticipants(roomId);
    }
  }

  getParticipants(roomId: string): User[] {
    return [...(this.participants.get(roomId) || [])];
  }

  broadcastParticipants(roomId: string): void {
    const participants = this.getParticipants(roomId);
    this.io.to(roomId).emit('room:participants', participants);
  }

  async sendRoomHistory(socket: any, roomId: string): Promise<void> {
    try {
      const history = await getRoomHistoryWithUser(roomId, 500);
      socket.emit('room:history', history);
    } catch (error) {
      console.error('Error fetching room history:', error);
    }
  }

  async getAllRooms(): Promise<Room[]> {
    try {
      return await getAllRooms();
    } catch (error) {
      console.error('Error fetching all rooms:', error);
      return [];
    }
  }

  async getRoomById(roomId: string): Promise<Room | null> {
    try {
      return await getRoomById(roomId);
    } catch (error) {
      console.error('Error fetching room by ID:', error);
      return null;
    }
  }

  private async upsertUserAndRoom(user: User, roomId: string): Promise<void> {
    try {
      await createUser(user);
      // Note: Room should already exist from seeding, but we'll ensure it exists
      const room = await getRoomById(roomId);
      if (!room) {
        console.warn(
          `Room ${roomId} not found, this should not happen with seeded rooms`
        );
      }
    } catch (error) {
      console.error('Error upserting user and room:', error);
    }
  }
}
