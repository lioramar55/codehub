import { Server } from 'socket.io';
import { User } from '@codehub/shared-models';
import { RoomManager } from './room-manager';
import { MessageManager } from './message-manager';
import { BotHandler } from './bot-service';
import { EventHandlers } from './event-handlers';

export function setupSocket(io: Server) {
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
    let self: User | null = null;
    let currentRoomId: string | null = null;

    // Get available rooms
    socket.on('rooms:get', async () => {
      await eventHandlers.handleGetRooms(socket);
    });

    // Get available rooms
    socket.on('system:add-or-update-user', async (payload: { user: User }) => {
      await eventHandlers.createOrUpdateUser(payload.user);
    });

    // Room join event
    socket.on('room:join', async (payload: { user: User; roomId: string }) => {
      // Leave current room if any
      if (currentRoomId && self) {
        await eventHandlers.handleRoomLeave(socket, self, currentRoomId);
      }

      self = payload.user;
      currentRoomId = payload.roomId;
      await eventHandlers.handleRoomJoin(socket, payload);
    });

    // Room leave event
    socket.on('room:leave', async () => {
      if (currentRoomId && self) {
        await eventHandlers.handleRoomLeave(socket, self, currentRoomId);
        currentRoomId = null;
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      if (currentRoomId && self) {
        await eventHandlers.handleDisconnect(socket, self, currentRoomId);
      }
    });

    // Message send event
    socket.on(
      'message:send',
      async (payload: { author: User; content: string; roomId: string }) => {
        await eventHandlers.handleMessageSend(socket, payload);
      }
    );

    // Typing events
    socket.on('typing:start', (payload: { userId: string; roomId: string }) => {
      eventHandlers.handleTypingStart(socket, payload);
    });

    socket.on('typing:stop', (payload: { userId: string; roomId: string }) => {
      eventHandlers.handleTypingStop(socket, payload);
    });
  });
}
