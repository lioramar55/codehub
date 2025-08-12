import { Server } from 'socket.io';
import { User } from '@codehub/shared-models';
import { RoomManager } from './room-manager';
import { MessageManager } from './message-manager';
import { BotHandler } from './bot-service';
import { EventHandlers } from './event-handlers';
import { logSocketEvent, logSocketError, logInfo } from '../utils/logger';

export function setupSocket(io: Server) {
  logInfo('Setting up Socket.IO server...');

  // Initialize managers and handlers
  const roomManager = new RoomManager(io);
  const messageManager = new MessageManager(io);
  const botHandler = new BotHandler(messageManager);
  const eventHandlers = new EventHandlers(
    roomManager,
    messageManager,
    botHandler
  );

  io.on('connection', (socket) => {
    logSocketEvent('connection', socket.id);

    let self: User | null = null;
    let currentRoomId: string | null = null;

    // Handle ping for keep-alive
    socket.on('ping', () => {
      logSocketEvent('ping', socket.id);
      socket.emit('pong');
    });

    // Get available rooms
    socket.on('rooms:get', async () => {
      logSocketEvent('rooms:get', socket.id);
      try {
        await eventHandlers.handleGetRooms(socket);
      } catch (error) {
        logSocketError(error as Error, socket.id, 'rooms:get');
      }
    });

    // Add or update user
    socket.on('system:add-or-update-user', async (payload: { user: User }) => {
      logSocketEvent('system:add-or-update-user', socket.id, {
        userId: payload.user.id,
        userName: payload.user.name,
      });
      try {
        await eventHandlers.createOrUpdateUser(payload.user);
      } catch (error) {
        logSocketError(error as Error, socket.id, 'system:add-or-update-user');
      }
    });

    // Room join event
    socket.on('room:join', async (payload: { user: User; roomId: string }) => {
      logSocketEvent('room:join', socket.id, {
        userId: payload.user.id,
        roomId: payload.roomId,
      });

      try {
        // Leave current room if any
        if (currentRoomId && self) {
          await eventHandlers.handleRoomLeave(socket, self, currentRoomId);
        }

        self = payload.user;
        currentRoomId = payload.roomId;
        await eventHandlers.handleRoomJoin(socket, payload);
      } catch (error) {
        logSocketError(error as Error, socket.id, 'room:join');
      }
    });

    // Room leave event
    socket.on('room:leave', async () => {
      logSocketEvent('room:leave', socket.id, {
        roomId: currentRoomId,
        userId: self?.id,
      });

      try {
        if (currentRoomId && self) {
          await eventHandlers.handleRoomLeave(socket, self, currentRoomId);
          currentRoomId = null;
        }
      } catch (error) {
        logSocketError(error as Error, socket.id, 'room:leave');
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      logSocketEvent('disconnect', socket.id, {
        roomId: currentRoomId,
        userId: self?.id,
      });

      try {
        if (currentRoomId && self) {
          await eventHandlers.handleDisconnect(socket, self, currentRoomId);
        }
      } catch (error) {
        logSocketError(error as Error, socket.id, 'disconnect');
      }
    });

    // Message send event
    socket.on(
      'message:send',
      async (payload: { author: User; content: string; roomId: string }) => {
        logSocketEvent('message:send', socket.id, {
          userId: payload.author.id,
          roomId: payload.roomId,
          contentLength: payload.content.length,
        });

        try {
          await eventHandlers.handleMessageSend(socket, payload);
        } catch (error) {
          logSocketError(error as Error, socket.id, 'message:send');
        }
      }
    );

    // Typing events
    socket.on('typing:start', (payload: { userId: string; roomId: string }) => {
      logSocketEvent('typing:start', socket.id, {
        userId: payload.userId,
        roomId: payload.roomId,
      });
      try {
        eventHandlers.handleTypingStart(socket, payload);
      } catch (error) {
        logSocketError(error as Error, socket.id, 'typing:start');
      }
    });

    socket.on('typing:stop', (payload: { userId: string; roomId: string }) => {
      logSocketEvent('typing:stop', socket.id, {
        userId: payload.userId,
        roomId: payload.roomId,
      });
      try {
        eventHandlers.handleTypingStop(socket, payload);
      } catch (error) {
        logSocketError(error as Error, socket.id, 'typing:stop');
      }
    });
  });
}
