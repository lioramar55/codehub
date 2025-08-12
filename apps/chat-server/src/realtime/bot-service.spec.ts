import { BotHandler } from './bot-service';
import { MessageManager } from './message-manager';
import { BotService } from '../services/bot';
import { User, ChatEvent } from '@codehub/shared-models';
import { BOT_CONSTANTS, ERROR_MESSAGES } from './constants';

// Mock dependencies
jest.mock('./message-manager');
jest.mock('../services/bot');
jest.mock('../services/user.repository');
jest.mock('./constants', () => ({
  BOT_CONSTANTS: {
    RATE_LIMIT: {
      WINDOW_MS: 60000, // 1 minute
      MAX_MESSAGES_PER_MINUTE: 5,
    },
  },
  ERROR_MESSAGES: {
    BOT_RATE_LIMIT: 'Rate limit exceeded',
    BOT_ERROR: 'Bot error occurred',
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

describe('BotHandler', () => {
  let botHandler: BotHandler;
  let mockMessageManager: jest.Mocked<MessageManager>;
  let mockSocket: any;
  let mockUser: User;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock MessageManager
    mockMessageManager = {
      createUserMessage: jest.fn(),
      createBotMessage: jest.fn(),
      createSystemMessage: jest.fn(),
      saveMessage: jest.fn(),
      broadcastMessage: jest.fn(),
      sendMessageToSocket: jest.fn(),
    } as unknown as jest.Mocked<MessageManager>;

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

    // Create BotHandler instance
    botHandler = new BotHandler(mockMessageManager);

    // Mock createUser to resolve
    const { createUser } = require('../services/user.repository');
    createUser.mockResolvedValue(undefined);
  });

  describe('handleUserMessage', () => {
    const mockUserMessage: ChatEvent = {
      id: 'msg-123',
      type: 'user',
      content: 'How do I create an Angular component?',
      user: mockUser,
      roomId: 'room-123',
      createdAt: new Date().toISOString(),
    };

    beforeEach(() => {
      mockMessageManager.createUserMessage.mockReturnValue(mockUserMessage);
    });

    it('should handle user message and trigger bot response for programming question', async () => {
      // Mock BotService.isProgrammingQuestion to return true
      (BotService.isProgrammingQuestion as jest.Mock).mockReturnValue(true);
      (BotService.askBot as jest.Mock).mockResolvedValue('Bot response');

      const mockBotMessage: ChatEvent = {
        id: 'bot-123',
        type: 'bot',
        content: 'Bot response',
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockBotMessage);

      await botHandler.handleUserMessage(
        mockSocket,
        mockUser,
        'How do I create an Angular component?',
        'room-123'
      );

      // Verify user message was created and saved
      expect(mockMessageManager.createUserMessage).toHaveBeenCalledWith(
        mockUser,
        'How do I create an Angular component?',
        'room-123',
        false
      );
      expect(mockMessageManager.saveMessage).toHaveBeenCalledWith(
        mockUserMessage
      );
      expect(mockMessageManager.broadcastMessage).toHaveBeenCalledWith(
        mockUserMessage
      );

      // Verify bot response was triggered
      expect(BotService.isProgrammingQuestion).toHaveBeenCalledWith(
        'How do I create an Angular component?'
      );
      expect(BotService.askBot).toHaveBeenCalledWith(
        'How do I create an Angular component?'
      );
    });

    it('should handle user message without bot response for non-programming question', async () => {
      // Mock BotService.isProgrammingQuestion to return false
      (BotService.isProgrammingQuestion as jest.Mock).mockReturnValue(false);

      await botHandler.handleUserMessage(
        mockSocket,
        mockUser,
        'What is the weather like?',
        'room-123'
      );

      // Verify user message was created and saved
      expect(mockMessageManager.createUserMessage).toHaveBeenCalledWith(
        mockUser,
        'What is the weather like?',
        'room-123',
        false
      );
      expect(mockMessageManager.saveMessage).toHaveBeenCalledWith(
        mockUserMessage
      );
      expect(mockMessageManager.broadcastMessage).toHaveBeenCalledWith(
        mockUserMessage
      );

      // Verify bot response was not triggered
      expect(BotService.askBot).not.toHaveBeenCalled();
    });

    it('should handle explicit bot request (isSentToBot = true)', async () => {
      // For explicit bot requests, it should still check if it's a programming question
      // The current implementation requires both isSentToBot=true AND isProgrammingQuestion=true
      (BotService.isProgrammingQuestion as jest.Mock).mockReturnValue(true);
      (BotService.askBot as jest.Mock).mockResolvedValue('Bot response');

      const mockBotMessage: ChatEvent = {
        id: 'bot-123',
        type: 'bot',
        content: 'Bot response',
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockBotMessage);

      await botHandler.handleUserMessage(
        mockSocket,
        mockUser,
        'Hello bot',
        'room-123',
        true // isSentToBot = true
      );

      // Verify bot response was triggered
      expect(BotService.askBot).toHaveBeenCalledWith('Hello bot');
    });

    it('should handle bot errors gracefully', async () => {
      (BotService.isProgrammingQuestion as jest.Mock).mockReturnValue(true);
      (BotService.askBot as jest.Mock).mockRejectedValue(
        new Error('Bot error')
      );

      const mockErrorMessage: ChatEvent = {
        id: 'error-123',
        type: 'bot',
        content: ERROR_MESSAGES.BOT_ERROR,
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockErrorMessage);

      await botHandler.handleUserMessage(
        mockSocket,
        mockUser,
        'How do I create an Angular component?',
        'room-123'
      );

      // Verify error message was sent to socket
      expect(mockMessageManager.createBotMessage).toHaveBeenCalledWith(
        ERROR_MESSAGES.BOT_ERROR,
        'room-123'
      );
      expect(mockMessageManager.sendMessageToSocket).toHaveBeenCalledWith(
        mockSocket,
        mockErrorMessage
      );
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      (BotService.isProgrammingQuestion as jest.Mock).mockReturnValue(true);
      (BotService.askBot as jest.Mock).mockResolvedValue('Bot response');
    });

    it('should allow messages within rate limit', async () => {
      const mockBotMessage: ChatEvent = {
        id: 'bot-123',
        type: 'bot',
        content: 'Bot response',
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockBotMessage);

      // Send 3 messages (within limit of 5)
      for (let i = 0; i < 3; i++) {
        await botHandler.handleUserMessage(
          mockSocket,
          mockUser,
          `Question ${i}`,
          'room-123'
        );
      }

      // All should succeed
      expect(BotService.askBot).toHaveBeenCalledTimes(3);
      expect(mockMessageManager.createBotMessage).toHaveBeenCalledTimes(3);
    });

    it('should block messages when rate limit exceeded', async () => {
      const mockRateLimitMessage: ChatEvent = {
        id: 'rate-limit-123',
        type: 'bot',
        content: ERROR_MESSAGES.BOT_RATE_LIMIT,
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockRateLimitMessage);

      // Send 6 messages (exceeds limit of 5)
      for (let i = 0; i < 6; i++) {
        await botHandler.handleUserMessage(
          mockSocket,
          mockUser,
          `Question ${i}`,
          'room-123'
        );
      }

      // First 5 should succeed, 6th should be rate limited
      expect(BotService.askBot).toHaveBeenCalledTimes(5);
      expect(mockMessageManager.createBotMessage).toHaveBeenCalledTimes(6);

      // Last call should be rate limit message
      expect(mockMessageManager.createBotMessage).toHaveBeenLastCalledWith(
        ERROR_MESSAGES.BOT_RATE_LIMIT,
        'room-123'
      );
    });

    it('should handle rate limiting per room', async () => {
      const mockBotMessage: ChatEvent = {
        id: 'bot-123',
        type: 'bot',
        content: 'Bot response',
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockBotMessage);

      // Send 6 messages to room-123 (exceeds limit)
      for (let i = 0; i < 6; i++) {
        await botHandler.handleUserMessage(
          mockSocket,
          mockUser,
          `Question ${i}`,
          'room-123'
        );
      }

      // Send 3 messages to room-456 (should work fine)
      for (let i = 0; i < 3; i++) {
        await botHandler.handleUserMessage(
          mockSocket,
          mockUser,
          `Question ${i}`,
          'room-456'
        );
      }

      // Room-123: 5 successful + 1 rate limited
      // Room-456: 3 successful
      expect(BotService.askBot).toHaveBeenCalledTimes(8);
    });
  });

  describe('private methods', () => {
    it('should clean old timestamps when checking rate limit', async () => {
      // Mock Date.now to control time
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);

      (BotService.isProgrammingQuestion as jest.Mock).mockReturnValue(true);
      (BotService.askBot as jest.Mock).mockResolvedValue('Bot response');

      const mockBotMessage: ChatEvent = {
        id: 'bot-123',
        type: 'bot',
        content: 'Bot response',
        user: { id: 'bot', name: 'NG Guru', avatarUrl: '', isBot: true },
        roomId: 'room-123',
        createdAt: new Date().toISOString(),
      };
      mockMessageManager.createBotMessage.mockReturnValue(mockBotMessage);

      // Send 3 messages at time 1000000
      for (let i = 0; i < 3; i++) {
        await botHandler.handleUserMessage(
          mockSocket,
          mockUser,
          `Question ${i}`,
          'room-123'
        );
      }

      // Advance time by 2 minutes (120000ms)
      currentTime += 120000;

      // Send 3 more messages
      for (let i = 0; i < 3; i++) {
        await botHandler.handleUserMessage(
          mockSocket,
          mockUser,
          `Question ${i + 3}`,
          'room-123'
        );
      }

      // All 6 should succeed because old timestamps were cleaned
      expect(BotService.askBot).toHaveBeenCalledTimes(6);

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });
});
