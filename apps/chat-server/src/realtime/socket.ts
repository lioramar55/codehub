import { Server } from 'socket.io';
import { Message, User } from '@codehub/shared-models';

const GENERAL_ROOM_ID = 'general';

export function setupSocket(io: Server) {
  let participants: User[] = [];

  io.on('connection', (socket) => {
    let self: User | null = null;

    socket.on('room:join', (payload: { user: User }) => {
      const { user } = payload;
      self = user;
      socket.join(GENERAL_ROOM_ID);

      participants.push(self);

      io.to(GENERAL_ROOM_ID).emit('room:participants', participants);
      io.to(GENERAL_ROOM_ID).emit('system:event', { type: 'join', user });
    });

    socket.on('room:leave', () => {
      if (!self) return;

      participants = participants.filter((p) => p.id !== self.id);

      io.to(GENERAL_ROOM_ID).emit('room:participants', participants);
      io.to(GENERAL_ROOM_ID).emit('system:event', {
        type: 'leave',
        user: self,
      });

      socket.leave(GENERAL_ROOM_ID);
      self = null;
    });

    socket.on('disconnect', () => {
      if (!self) return;

      participants = participants.filter((p) => p.id !== self.id);

      io.to(GENERAL_ROOM_ID).emit('room:participants', participants);
      io.to(GENERAL_ROOM_ID).emit('system:event', {
        type: 'leave',
        user: self,
      });
    });

    socket.on('message:send', (payload: { author: User; content: string }) => {
      const message: Message = {
        id: crypto.randomUUID(),
        author: payload.author,
        content: payload.content,
        createdAt: new Date().toISOString(),
      };

      io.to(GENERAL_ROOM_ID).emit('message:new', message);
    });

    socket.on('typing:start', (userId: string) => {
      socket.to(GENERAL_ROOM_ID).emit('typing:start', { userId });
    });

    socket.on('typing:stop', (userId: string) => {
      socket.to(GENERAL_ROOM_ID).emit('typing:stop', { userId });
    });
  });
}
