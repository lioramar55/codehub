import { RoomManager } from './room-manager';
import { Server } from 'socket.io';
import { User, Room } from '@codehub/shared-models';

// Mock dependencies
jest.mock('socket.io');
jest.mock('../services/user.repository');
jest.mock('../services/room.repository');
jest.mock('../services/message.repository');

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('RoomManager', () => {
  let roomManager: RoomManager;
  let mockIo: jest.Mocked<Server>;
  let mockSocket: any;
  let mockUser: User;
  let mockRoom: Room;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Socket.IO server
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as unknown as jest.Mocked<Server>;

    // Create mock socket
    mockSocket = {
      emit: jest.fn(),
    };

    // Create mock user
    mockUser = {
      id: 'user-123',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    // Create mock room
    mockRoom = {
      id: 'room-123',
      name: 'Test Room',
    };

    // Create RoomManager instance
    roomManager = new RoomManager(mockIo);

    // Mock repository functions
    const { createUser } = require('../services/user.repository');
    const {
      createRoom,
      getAllRooms,
      getRoomById,
    } = require('../services/room.repository');
    const {
      getRoomHistoryWithUser,
    } = require('../services/message.repository');

    createUser.mockResolvedValue(undefined);
    createRoom.mockResolvedValue(undefined);
    getAllRooms.mockResolvedValue([mockRoom]);
    getRoomById.mockResolvedValue(mockRoom);
    getRoomHistoryWithUser.mockResolvedValue([]);
  });

  describe('addParticipant', () => {
    it('should add participant to room successfully', async () => {
      await roomManager.addParticipant(mockUser, 'room-123');

      const participants = roomManager.getParticipants('room-123');
      expect(participants).toHaveLength(1);
      expect(participants[0]).toEqual(mockUser);
    });

    it('should not add duplicate participant', async () => {
      // Add participant twice
      await roomManager.addParticipant(mockUser, 'room-123');
      await roomManager.addParticipant(mockUser, 'room-123');

      const participants = roomManager.getParticipants('room-123');
      expect(participants).toHaveLength(1);
      expect(participants[0]).toEqual(mockUser);
    });

    it('should handle multiple participants in same room', async () => {
      const user2: User = {
        id: 'user-456',
        name: 'Test User 2',
        avatarUrl: 'https://example.com/avatar2.jpg',
      };

      await roomManager.addParticipant(mockUser, 'room-123');
      await roomManager.addParticipant(user2, 'room-123');

      const participants = roomManager.getParticipants('room-123');
      expect(participants).toHaveLength(2);
      expect(participants).toContainEqual(mockUser);
      expect(participants).toContainEqual(user2);
    });

    it('should handle participants in different rooms', async () => {
      const user2: User = {
        id: 'user-456',
        name: 'Test User 2',
        avatarUrl: 'https://example.com/avatar2.jpg',
      };

      await roomManager.addParticipant(mockUser, 'room-123');
      await roomManager.addParticipant(user2, 'room-456');

      const participants1 = roomManager.getParticipants('room-123');
      const participants2 = roomManager.getParticipants('room-456');

      expect(participants1).toHaveLength(1);
      expect(participants1[0]).toEqual(mockUser);
      expect(participants2).toHaveLength(1);
      expect(participants2[0]).toEqual(user2);
    });

    it('should call createUser when adding participant', async () => {
      const { createUser } = require('../services/user.repository');

      await roomManager.addParticipant(mockUser, 'room-123');

      expect(createUser).toHaveBeenCalledWith(mockUser);
    });

    it('should broadcast participants after adding', async () => {
      await roomManager.addParticipant(mockUser, 'room-123');

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('room:participants', [mockUser]);
    });

    it('should handle repository errors gracefully', async () => {
      const { createUser } = require('../services/user.repository');
      const error = new Error('Database error');
      createUser.mockRejectedValue(error);

      // Should not throw error
      await expect(
        roomManager.addParticipant(mockUser, 'room-123')
      ).resolves.toBeUndefined();
    });
  });

  describe('removeParticipant', () => {
    beforeEach(async () => {
      await roomManager.addParticipant(mockUser, 'room-123');
    });

    it('should remove participant from room', () => {
      roomManager.removeParticipant(mockUser.id, 'room-123');

      const participants = roomManager.getParticipants('room-123');
      expect(participants).toHaveLength(0);
    });

    it('should broadcast participants after removing', () => {
      roomManager.removeParticipant(mockUser.id, 'room-123');

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('room:participants', []);
    });

    it('should handle removing non-existent participant', () => {
      const initialParticipants = roomManager.getParticipants('room-123');
      expect(initialParticipants).toHaveLength(1);

      roomManager.removeParticipant('non-existent-user', 'room-123');

      const participants = roomManager.getParticipants('room-123');
      expect(participants).toHaveLength(1); // Should remain unchanged
    });

    it('should handle removing from non-existent room', () => {
      // Should not throw error
      expect(() => {
        roomManager.removeParticipant(mockUser.id, 'non-existent-room');
      }).not.toThrow();
    });

    it('should handle multiple participants correctly', async () => {
      const user2: User = {
        id: 'user-456',
        name: 'Test User 2',
        avatarUrl: 'https://example.com/avatar2.jpg',
      };

      await roomManager.addParticipant(user2, 'room-123');

      // Remove first user
      roomManager.removeParticipant(mockUser.id, 'room-123');

      const participants = roomManager.getParticipants('room-123');
      expect(participants).toHaveLength(1);
      expect(participants[0]).toEqual(user2);
    });
  });

  describe('getParticipants', () => {
    it('should return empty array for non-existent room', () => {
      const participants = roomManager.getParticipants('non-existent-room');
      expect(participants).toEqual([]);
    });

    it('should return copy of participants array', async () => {
      await roomManager.addParticipant(mockUser, 'room-123');

      const participants1 = roomManager.getParticipants('room-123');
      const participants2 = roomManager.getParticipants('room-123');

      // Modifying one should not affect the other
      participants1.push({ id: 'temp', name: 'Temp', avatarUrl: '' });

      const participants3 = roomManager.getParticipants('room-123');
      expect(participants3).toHaveLength(1); // Should still be 1
    });
  });

  describe('broadcastParticipants', () => {
    it('should broadcast participants to room', async () => {
      await roomManager.addParticipant(mockUser, 'room-123');

      roomManager.broadcastParticipants('room-123');

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('room:participants', [mockUser]);
    });

    it('should broadcast empty array for room with no participants', () => {
      roomManager.broadcastParticipants('room-123');

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('room:participants', []);
    });
  });

  describe('sendRoomHistory', () => {
    it('should send room history to socket', async () => {
      const mockHistory = [
        {
          id: 'msg-1',
          type: 'user',
          content: 'Hello',
          user: mockUser,
          roomId: 'room-123',
          createdAt: new Date().toISOString(),
        },
      ];

      const {
        getRoomHistoryWithUser,
      } = require('../services/message.repository');
      getRoomHistoryWithUser.mockResolvedValue(mockHistory);

      await roomManager.sendRoomHistory(mockSocket, 'room-123');

      expect(getRoomHistoryWithUser).toHaveBeenCalledWith('room-123', 500);
      expect(mockSocket.emit).toHaveBeenCalledWith('room:history', mockHistory);
    });

    it('should handle repository errors gracefully', async () => {
      const {
        getRoomHistoryWithUser,
      } = require('../services/message.repository');
      const error = new Error('Database error');
      getRoomHistoryWithUser.mockRejectedValue(error);

      // Should not throw error
      await expect(
        roomManager.sendRoomHistory(mockSocket, 'room-123')
      ).resolves.toBeUndefined();
    });
  });

  describe('getAllRooms', () => {
    it('should return all rooms from repository', async () => {
      const rooms = await roomManager.getAllRooms();

      const { getAllRooms } = require('../services/room.repository');
      expect(getAllRooms).toHaveBeenCalled();
      expect(rooms).toEqual([mockRoom]);
    });

    it('should handle repository errors gracefully', async () => {
      const { getAllRooms } = require('../services/room.repository');
      const error = new Error('Database error');
      getAllRooms.mockRejectedValue(error);

      const rooms = await roomManager.getAllRooms();
      expect(rooms).toEqual([]);
    });
  });

  describe('getRoomById', () => {
    it('should return room by ID from repository', async () => {
      const room = await roomManager.getRoomById('room-123');

      const { getRoomById } = require('../services/room.repository');
      expect(getRoomById).toHaveBeenCalledWith('room-123');
      expect(room).toEqual(mockRoom);
    });

    it('should handle repository errors gracefully', async () => {
      const { getRoomById } = require('../services/room.repository');
      const error = new Error('Database error');
      getRoomById.mockRejectedValue(error);

      const room = await roomManager.getRoomById('room-123');
      expect(room).toBeNull();
    });
  });

  describe('upsertUserAndRoom', () => {
    it('should call createUser and getRoomById', async () => {
      const { createUser } = require('../services/user.repository');
      const { getRoomById } = require('../services/room.repository');

      // This is called internally by addParticipant
      await roomManager.addParticipant(mockUser, 'room-123');

      expect(createUser).toHaveBeenCalledWith(mockUser);
      expect(getRoomById).toHaveBeenCalledWith('room-123');
    });

    it('should handle missing room gracefully', async () => {
      const { getRoomById } = require('../services/room.repository');
      getRoomById.mockResolvedValue(null);

      // Should not throw error
      await expect(
        roomManager.addParticipant(mockUser, 'non-existent-room')
      ).resolves.toBeUndefined();
    });

    it('should handle repository errors gracefully', async () => {
      const { createUser } = require('../services/user.repository');
      const error = new Error('Database error');
      createUser.mockRejectedValue(error);

      // Should not throw error
      await expect(
        roomManager.addParticipant(mockUser, 'room-123')
      ).resolves.toBeUndefined();
    });
  });
});
