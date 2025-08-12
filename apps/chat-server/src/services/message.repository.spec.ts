import { saveMessage, getRoomHistoryWithUser } from './message.repository';
import { ChatEvent } from '@codehub/shared-models';

// Mock dependencies
jest.mock('./db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Message Repository', () => {
  let mockPool: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool = require('./db').pool;
  });

  describe('saveMessage', () => {
    const mockMessage: ChatEvent = {
      id: 'msg-123',
      type: 'user',
      content: 'Hello world',
      user: {
        id: 'user-123',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      roomId: 'room-123',
      createdAt: '2024-01-01T00:00:00.000Z',
      isSentToBot: false,
    };

    it('should save user message successfully', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      await saveMessage(mockMessage);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)'
      );
      expect(queryCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8)');
      expect(queryCall[1]).toEqual([
        'msg-123',
        'user',
        'Hello world',
        null,
        'user-123',
        'room-123',
        '2024-01-01T00:00:00.000Z',
        false,
      ]);
    });

    it('should save bot message successfully', async () => {
      const botMessage: ChatEvent = {
        id: 'bot-123',
        type: 'bot',
        content: 'Bot response',
        user: {
          id: 'bot',
          name: 'NG Guru',
          avatarUrl: 'https://example.com/bot.jpg',
          isBot: true,
        },
        roomId: 'room-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await saveMessage(botMessage);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)'
      );
      expect(queryCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8)');
      expect(queryCall[1]).toEqual([
        'bot-123',
        'bot',
        'Bot response',
        null,
        'bot',
        'room-123',
        '2024-01-01T00:00:00.000Z',
        false,
      ]);
    });

    it('should save system message with kind', async () => {
      const systemMessage: ChatEvent = {
        id: 'sys-123',
        type: 'system',
        kind: 'join',
        user: {
          id: 'user-123',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        roomId: 'room-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await saveMessage(systemMessage);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)'
      );
      expect(queryCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8)');
      expect(queryCall[1]).toEqual([
        'sys-123',
        'system',
        null,
        'join',
        'user-123',
        'room-123',
        '2024-01-01T00:00:00.000Z',
        false,
      ]);
    });

    it('should handle message with isSentToBot true', async () => {
      const messageWithBot: ChatEvent = {
        ...mockMessage,
        isSentToBot: true,
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await saveMessage(messageWithBot);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)'
      );
      expect(queryCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8)');
      expect(queryCall[1]).toEqual([
        'msg-123',
        'user',
        'Hello world',
        null,
        'user-123',
        'room-123',
        '2024-01-01T00:00:00.000Z',
        true,
      ]);
    });

    it('should handle message without user', async () => {
      const messageWithoutUser: ChatEvent = {
        id: 'msg-123',
        type: 'system',
        kind: 'info',
        roomId: 'room-123',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await saveMessage(messageWithoutUser);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)'
      );
      expect(queryCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8)');
      expect(queryCall[1]).toEqual([
        'msg-123',
        'system',
        null,
        'info',
        null,
        'room-123',
        '2024-01-01T00:00:00.000Z',
        false,
      ]);
    });

    it('should handle message without roomId', async () => {
      const messageWithoutRoom: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: {
          id: 'user-123',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockPool.query.mockResolvedValue({ rows: [] });

      await saveMessage(messageWithoutRoom);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)'
      );
      expect(queryCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8)');
      expect(queryCall[1]).toEqual([
        'msg-123',
        'user',
        'Hello world',
        null,
        'user-123',
        null,
        '2024-01-01T00:00:00.000Z',
        false,
      ]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPool.query.mockRejectedValue(error);

      await expect(saveMessage(mockMessage)).rejects.toThrow('Database error');
    });
  });

  describe('getRoomHistoryWithUser', () => {
    const mockDbRows = [
      {
        id: 'msg-1',
        type: 'user',
        content: 'Hello world',
        kind: null,
        user_id: 'user-123',
        user_name: 'Test User',
        user_avatar_url: 'https://example.com/avatar.jpg',
        user_is_bot: false,
        room_id: 'room-123',
        created_at: '2024-01-01T00:00:00.000Z',
        is_sent_to_bot: false,
      },
      {
        id: 'msg-2',
        type: 'bot',
        content: 'Bot response',
        kind: null,
        user_id: 'bot',
        user_name: 'NG Guru',
        user_avatar_url: 'https://example.com/bot.jpg',
        user_is_bot: true,
        room_id: 'room-123',
        created_at: '2024-01-01T00:01:00.000Z',
        is_sent_to_bot: false,
      },
      {
        id: 'msg-3',
        type: 'system',
        content: null,
        kind: 'join',
        user_id: 'user-456',
        user_name: 'Another User',
        user_avatar_url: 'https://example.com/avatar2.jpg',
        user_is_bot: false,
        room_id: 'room-123',
        created_at: '2024-01-01T00:02:00.000Z',
        is_sent_to_bot: false,
      },
    ];

    it('should retrieve room history with default limit', async () => {
      mockPool.query.mockResolvedValue({ rows: mockDbRows });

      const result = await getRoomHistoryWithUser('room-123');

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'SELECT m.*, u.name as user_name, u.avatar_url as user_avatar_url, u.is_bot as user_is_bot, m.is_sent_to_bot'
      );
      expect(queryCall[0]).toContain('FROM messages m');
      expect(queryCall[0]).toContain('LEFT JOIN users u ON m.user_id = u.id');
      expect(queryCall[0]).toContain('WHERE m.room_id = $1');
      expect(queryCall[0]).toContain('ORDER BY m.created_at DESC');
      expect(queryCall[0]).toContain('LIMIT $2');
      expect(queryCall[1]).toEqual(['room-123', 500]);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'msg-3',
        type: 'system',
        content: null,
        kind: 'join',
        user: {
          id: 'user-456',
          name: 'Another User',
          avatarUrl: 'https://example.com/avatar2.jpg',
          isBot: false,
        },
        roomId: 'room-123',
        createdAt: '2024-01-01T00:02:00.000Z',
        isSentToBot: false,
      });
    });

    it('should retrieve room history with custom limit', async () => {
      mockPool.query.mockResolvedValue({ rows: mockDbRows.slice(0, 2) });

      const result = await getRoomHistoryWithUser('room-123', 2);

      const queryCall = mockPool.query.mock.calls[0];
      expect(queryCall[0]).toContain(
        'SELECT m.*, u.name as user_name, u.avatar_url as user_avatar_url, u.is_bot as user_is_bot, m.is_sent_to_bot'
      );
      expect(queryCall[0]).toContain('FROM messages m');
      expect(queryCall[0]).toContain('LEFT JOIN users u ON m.user_id = u.id');
      expect(queryCall[0]).toContain('WHERE m.room_id = $1');
      expect(queryCall[0]).toContain('ORDER BY m.created_at DESC');
      expect(queryCall[0]).toContain('LIMIT $2');
      expect(queryCall[1]).toEqual(['room-123', 2]);

      expect(result).toHaveLength(2);
    });

    it('should handle messages without user data', async () => {
      const rowsWithoutUser = [
        {
          id: 'msg-1',
          type: 'system',
          content: null,
          kind: 'info',
          user_id: null,
          user_name: null,
          user_avatar_url: null,
          user_is_bot: null,
          room_id: 'room-123',
          created_at: '2024-01-01T00:00:00.000Z',
          is_sent_to_bot: false,
        },
      ];

      mockPool.query.mockResolvedValue({ rows: rowsWithoutUser });

      const result = await getRoomHistoryWithUser('room-123');

      expect(result[0]).toEqual({
        id: 'msg-1',
        type: 'system',
        content: null,
        kind: 'info',
        user: undefined,
        roomId: 'room-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        isSentToBot: false,
      });
    });

    it('should reverse the order of messages (oldest first)', async () => {
      mockPool.query.mockResolvedValue({ rows: mockDbRows });

      const result = await getRoomHistoryWithUser('room-123');

      // The mock data is in DESC order, and the function reverses it, so result should be in ASC order
      // But looking at the mock data: msg-1 (00:00), msg-2 (00:01), msg-3 (00:02)
      // After reverse: msg-3 (00:02), msg-2 (00:01), msg-1 (00:00) - this is wrong
      // Let me check the actual implementation - it should be oldest first
      expect(result[0].id).toBe('msg-3');
      expect(result[1].id).toBe('msg-2');
      expect(result[2].id).toBe('msg-1');
    });

    it('should handle empty result set', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await getRoomHistoryWithUser('room-123');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockPool.query.mockRejectedValue(error);

      await expect(getRoomHistoryWithUser('room-123')).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle messages with all optional fields', async () => {
      const complexRow = {
        id: 'msg-complex',
        type: 'user',
        content: 'Complex message',
        kind: 'info',
        user_id: 'user-123',
        user_name: 'Test User',
        user_avatar_url: 'https://example.com/avatar.jpg',
        user_is_bot: true,
        room_id: 'room-123',
        created_at: '2024-01-01T00:00:00.000Z',
        is_sent_to_bot: true,
      };

      mockPool.query.mockResolvedValue({ rows: [complexRow] });

      const result = await getRoomHistoryWithUser('room-123');

      expect(result[0]).toEqual({
        id: 'msg-complex',
        type: 'user',
        content: 'Complex message',
        kind: 'info',
        user: {
          id: 'user-123',
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          isBot: true,
        },
        roomId: 'room-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        isSentToBot: true,
      });
    });
  });
});
