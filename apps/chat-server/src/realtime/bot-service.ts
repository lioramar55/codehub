import { Socket } from 'socket.io';
import { User, ChatEvent } from '@codehub/shared-models';
import { BotService as BotServiceClass } from '../services/bot';
import { BOT_CONSTANTS, ERROR_MESSAGES } from './constants';
import { MessageManager } from './message-manager';
import { createUser } from '../services/user.repository';

export class BotHandler {
  private messageTimestamps: Map<string, number[]> = new Map(); // roomId -> timestamps[]
  private messageManager: MessageManager;

  constructor(messageManager: MessageManager) {
    this.messageManager = messageManager;
  }

  async handleUserMessage(
    socket: Socket,
    author: User,
    content: string,
    roomId: string
  ): Promise<void> {
    // Upsert user (in case new info)
    await createUser(author);

    // Create and save user message
    const userMessage = this.messageManager.createUserMessage(
      author,
      content,
      roomId
    );
    await this.messageManager.saveMessage(userMessage);
    this.messageManager.broadcastMessage(userMessage);

    // Check if it's a programming question and handle bot response
    await this.handleBotResponse(socket, content, roomId);
  }

  private async handleBotResponse(
    socket: Socket,
    content: string,
    roomId: string
  ): Promise<void> {
    try {
      const isProgrammingQuestion = await BotServiceClass.isProgrammingQuestion(
        content
      );

      if (!isProgrammingQuestion) {
        return;
      }

      if (this.isRateLimited(roomId)) {
        const rateLimitMessage = this.messageManager.createBotMessage(
          ERROR_MESSAGES.BOT_RATE_LIMIT,
          roomId
        );
        await this.messageManager.saveMessage(rateLimitMessage);
        this.messageManager.sendMessageToSocket(socket, rateLimitMessage);
        return;
      }

      // Add timestamp for rate limiting
      this.addTimestamp(roomId);

      // Get bot reply
      const botReply = await BotServiceClass.askBot(content);
      const botMessage = this.messageManager.createBotMessage(botReply, roomId);

      await this.messageManager.saveMessage(botMessage);
      this.messageManager.broadcastMessage(botMessage);
    } catch (error) {
      console.error('Bot error:', error);
      const errorMessage = this.messageManager.createBotMessage(
        ERROR_MESSAGES.BOT_ERROR,
        roomId
      );
      await this.messageManager.saveMessage(errorMessage);
      this.messageManager.sendMessageToSocket(socket, errorMessage);
    }
  }

  private isRateLimited(roomId: string): boolean {
    const nowMs = Date.now();
    const oneMinuteAgo = nowMs - BOT_CONSTANTS.RATE_LIMIT.WINDOW_MS;

    // Get timestamps for this room
    const timestamps = this.messageTimestamps.get(roomId) || [];

    // Clean old timestamps
    const filteredTimestamps = timestamps.filter((ts) => ts > oneMinuteAgo);
    this.messageTimestamps.set(roomId, filteredTimestamps);

    return (
      filteredTimestamps.length >=
      BOT_CONSTANTS.RATE_LIMIT.MAX_MESSAGES_PER_MINUTE
    );
  }

  private addTimestamp(roomId: string): void {
    const timestamps = this.messageTimestamps.get(roomId) || [];
    timestamps.push(Date.now());
    this.messageTimestamps.set(roomId, timestamps);
  }
}
