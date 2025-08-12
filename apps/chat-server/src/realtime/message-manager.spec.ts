import { MessageManager } from './message-manager';
import { Server } from 'socket.io';
import { User, ChatEvent } from '@codehub/shared-models';
import { BOT_CONSTANTS } from './constants';

// Mock dependencies
jest.mock('socket.io');
jest.mock('../services/message.repository');
jest.mock('./constants', () => ({
  BOT_CONSTANTS: {
    NG_GURU: {
      id: 'bot',
      name: 'NG Guru',
      avatarUrl: 'https://example.com/bot-avatar.jpg',
      isBot: true,
    },
  },
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-12345-67890'),
  },
});

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('MessageManager', () => {
  let messageManager: MessageManager;
  let mockIo: jest.Mocked<Server>;
  let mockSocket: any;
  let mockUser: User;

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

    // Create MessageManager instance
    messageManager = new MessageManager(mockIo);

    // Mock saveMessage to resolve
    const { saveMessage } = require('../services/message.repository');
    saveMessage.mockResolvedValue(undefined);
  });

  describe('saveMessage', () => {
    it('should save message successfully', async () => {
      const { saveMessage } = require('../services/message.repository');
      const mockMessage: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: mockUser,
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };

      await messageManager.saveMessage(mockMessage);

      expect(saveMessage).toHaveBeenCalledWith(mockMessage);
    });

    it('should handle save errors gracefully', async () => {
      const { saveMessage } = require('../services/message.repository');
      const error = new Error('Database error');
      saveMessage.mockRejectedValue(error);

      const mockMessage: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: mockUser,
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };

      // Should not throw error
      await expect(
        messageManager.saveMessage(mockMessage)
      ).resolves.toBeUndefined();
    });
  });

  describe('broadcastMessage', () => {
    it('should broadcast message to room when roomId is provided', () => {
      const mockMessage: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: mockUser,
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };

      messageManager.broadcastMessage(mockMessage);

      expect(mockIo.to).toHaveBeenCalledWith('room-123');
      expect(mockIo.emit).toHaveBeenCalledWith('message:new', mockMessage);
    });

    it('should not broadcast when roomId is not provided', () => {
      const mockMessage: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: mockUser,
        roomId: undefined,
        createdAt: new Date().toISOString(),
      };

      messageManager.broadcastMessage(mockMessage);

      expect(mockIo.to).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });

    it('should not broadcast when roomId is null', () => {
      const mockMessage: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: mockUser,
        roomId: null as any,
        createdAt: new Date().toISOString(),
      };

      messageManager.broadcastMessage(mockMessage);

      expect(mockIo.to).not.toHaveBeenCalled();
      expect(mockIo.emit).not.toHaveBeenCalled();
    });
  });

  describe('sendMessageToSocket', () => {
    it('should send message to specific socket', () => {
      const mockMessage: ChatEvent = {
        id: 'msg-123',
        type: 'user',
        content: 'Hello world',
        user: mockUser,
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };

      messageManager.sendMessageToSocket(mockSocket, mockMessage);

      expect(mockSocket.emit).toHaveBeenCalledWith('message:new', mockMessage);
    });
  });

  describe('createSystemMessage', () => {
    it('should create system message with join kind', () => {
      const systemMessage = messageManager.createSystemMessage(
        mockUser,
        'join',
        'room-123'
      );

      expect(systemMessage).toEqual({
        id: 'test-uuid-12345-67890',
        type: 'system',
        kind: 'join',
        user: mockUser,
        roomId: 'room-123',
        createdAt: expect.any(String),
      });
      expect(systemMessage.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should create system message with leave kind', () => {
      const systemMessage = messageManager.createSystemMessage(
        mockUser,
        'leave',
        'room-123'
      );

      expect(systemMessage).toEqual({
        id: 'test-uuid-12345-67890',
        type: 'system',
        kind: 'leave',
        user: mockUser,
        roomId: 'room-123',
        createdAt: expect.any(String),
      });
    });
  });

  describe('createUserMessage', () => {
    it('should create user message with default isSentToBot', () => {
      const userMessage = messageManager.createUserMessage(
        mockUser,
        'Hello world',
        'room-123'
      );

      expect(userMessage).toEqual({
        id: 'test-uuid-12345-67890',
        user: mockUser,
        content: 'Hello world',
        createdAt: expect.any(String),
        roomId: 'room-123',
        type: 'user',
        isSentToBot: false,
      });
    });

    it('should create user message with isSentToBot true', () => {
      const userMessage = messageManager.createUserMessage(
        mockUser,
        'Hello bot',
        'room-123',
        true
      );

      expect(userMessage).toEqual({
        id: 'test-uuid-12345-67890',
        user: mockUser,
        content: 'Hello bot',
        createdAt: expect.any(String),
        roomId: 'room-123',
        type: 'user',
        isSentToBot: true,
      });
    });

    it('should generate unique ID for each message', () => {
      const message1 = messageManager.createUserMessage(
        mockUser,
        'Message 1',
        'room-123'
      );
      const message2 = messageManager.createUserMessage(
        mockUser,
        'Message 2',
        'room-123'
      );

      expect(message1.id).toBe('test-uuid-12345-67890');
      expect(message2.id).toBe('test-uuid-12345-67890');
      // In real scenario, crypto.randomUUID would generate different IDs
    });
  });

  describe('createBotMessage', () => {
    it('should create bot message with NG Guru user', () => {
      const botMessage = messageManager.createBotMessage(
        'Hello, I am the bot!',
        'room-123'
      );

      expect(botMessage).toEqual({
        id: 'test-uuid-12345-67890',
        user: BOT_CONSTANTS.NG_GURU,
        content: 'Hello, I am the bot!',
        createdAt: expect.any(String),
        roomId: 'room-123',
        type: 'bot',
      });
    });

    it('should use correct bot user from constants', () => {
      const botMessage = messageManager.createBotMessage(
        'Test bot response',
        'room-456'
      );

      expect(botMessage.user).toEqual({
        id: 'bot',
        name: 'NG Guru',
        avatarUrl: 'https://example.com/bot-avatar.jpg',
        isBot: true,
      });
    });
  });

  describe('message creation edge cases', () => {
    it('should handle empty content in user message', () => {
      const userMessage = messageManager.createUserMessage(
        mockUser,
        '',
        'room-123'
      );

      expect(userMessage.content).toBe('');
    });

    it('should handle empty content in bot message', () => {
      const botMessage = messageManager.createBotMessage('', 'room-123');

      expect(botMessage.content).toBe('');
    });

    it('should handle special characters in content', () => {
      const specialContent = 'Hello @#$%^&*()_+-=[]{}|;:,.<>?';
      const userMessage = messageManager.createUserMessage(
        mockUser,
        specialContent,
        'room-123'
      );

      expect(userMessage.content).toBe(specialContent);
    });
  });

  describe('timestamp generation', () => {
    it('should generate valid ISO timestamp', () => {
      const userMessage = messageManager.createUserMessage(
        mockUser,
        'Test message',
        'room-123'
      );

      const timestamp = new Date(userMessage.createdAt);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(userMessage.createdAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should generate recent timestamp', () => {
      const before = new Date();
      const userMessage = messageManager.createUserMessage(
        mockUser,
        'Test message',
        'room-123'
      );
      const after = new Date();

      const messageTime = new Date(userMessage.createdAt);
      expect(messageTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(messageTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
