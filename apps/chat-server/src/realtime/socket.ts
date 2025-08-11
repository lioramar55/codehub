import { Server } from 'socket.io';
import { ChatEvent, User } from '@codehub/shared-models';
import { BotService } from '../services/bot';

const GENERAL_ROOM_ID = 'general';
const NG_GURU = { id: 'ng-guro', name: 'Ng Guro', isBot: true };
export function setupSocket(io: Server) {
  let participants: User[] = [];
  let messageTimestamps: number[] = [];

  io.on('connection', (socket) => {
    let self: User | null = null;

    socket.on('room:join', (payload: { user: User }) => {
      const { user } = payload;
      self = user;
      socket.join(GENERAL_ROOM_ID);

      participants.push(self);

      io.to(GENERAL_ROOM_ID).emit('room:participants', participants);
      io.to(GENERAL_ROOM_ID).emit('message:new', {
        type: 'system',
        kind: 'join',
        user,
        roomId: GENERAL_ROOM_ID,
        createdAt: new Date().toISOString(),
      } as ChatEvent);
    });

    socket.on('room:leave', () => {
      if (!self) return;

      participants = participants.filter((p) => p.id !== self.id);

      io.to(GENERAL_ROOM_ID).emit('room:participants', participants);
      io.to(GENERAL_ROOM_ID).emit('message:new', {
        type: 'system',
        user: self,
        roomId: GENERAL_ROOM_ID,
        kind: 'leave',
        createdAt: new Date().toISOString(),
      } as ChatEvent);

      socket.leave(GENERAL_ROOM_ID);
      self = null;
    });

    socket.on('disconnect', () => {
      if (!self) return;

      participants = participants.filter((p) => p.id !== self.id);

      io.to(GENERAL_ROOM_ID).emit('room:participants', participants);
      io.to(GENERAL_ROOM_ID).emit('message:new', {
        type: 'system',
        user: self,
        roomId: GENERAL_ROOM_ID,
        kind: 'leave',
        createdAt: new Date().toISOString(),
      } as ChatEvent);
    });

    socket.on(
      'message:send',
      async (payload: { author: User; content: string }) => {
        const message: ChatEvent = {
          id: crypto.randomUUID(),
          user: payload.author,
          content: payload.content,
          createdAt: new Date().toISOString(),
          roomId: GENERAL_ROOM_ID,
          type: 'user',
        };

        io.to(GENERAL_ROOM_ID).emit('message:new', message);

        try {
          const isProgrammingQuestion = await BotService.isProgrammingQuestion(
            payload.content
          );

          if (isProgrammingQuestion) {
            const nowMs = Date.now();
            const oneMinuteAgo = nowMs - 60_000;
            messageTimestamps = messageTimestamps.filter(
              (ts) => ts > oneMinuteAgo
            );

            if (messageTimestamps.length >= 5) {
              const botMessage: ChatEvent = {
                id: crypto.randomUUID(),
                user: NG_GURU,
                content:
                  'NG Guru limit reached. Please wait a minute and try again (limit is 5 messages per minute).',
                createdAt: new Date().toISOString(),
                roomId: GENERAL_ROOM_ID,
                type: 'bot',
              };

              socket.emit('message:new', botMessage);
              return;
            }

            // Record current message timestamp
            messageTimestamps.push(nowMs);

            const botReply = await BotService.askBot(payload.content);
            const botMessage: ChatEvent = {
              id: crypto.randomUUID(),
              user: NG_GURU,
              content: botReply,
              createdAt: new Date().toISOString(),
              roomId: GENERAL_ROOM_ID,
              type: 'bot',
            };

            io.to(GENERAL_ROOM_ID).emit('message:new', botMessage);
          }
        } catch (err) {
          console.error('Bot error:', err);

          const botMessage: ChatEvent = {
            id: crypto.randomUUID(),
            user: NG_GURU,
            content:
              'NG Guru is experiencing difficulties, please try again later.',
            createdAt: new Date().toISOString(),
            roomId: GENERAL_ROOM_ID,
            type: 'bot',
          };

          socket.emit('message:new', botMessage);
        }
      }
    );

    socket.on('typing:start', (userId: string) => {
      socket.to(GENERAL_ROOM_ID).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (userId: string) => {
      socket.to(GENERAL_ROOM_ID).emit('typing:stop', { userId });
    });
  });
}
