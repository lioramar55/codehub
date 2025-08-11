import { Server } from 'socket.io';

type Participant = { id: string; name: string };
type MessagePayload = {
  id: string;
  roomId: string;
  author: Participant;
  content: string;
  createdAt: string;
};

export function setupSocket(io: Server) {
  const roomIdToParticipants = new Map<string, Map<string, Participant>>();

  const getParticipants = (roomId: string): Participant[] => {
    return Array.from(roomIdToParticipants.get(roomId)?.values() ?? []);
  };

  io.on('connection', (socket) => {
    let currentRoomId: string | null = null;
    let self: Participant | null = null;

    socket.on('room:join', (payload: { roomId: string; user: Participant }) => {
      const { roomId, user } = payload;
      if (currentRoomId) socket.leave(currentRoomId);
      currentRoomId = roomId;
      self = user;
      socket.join(roomId);

      const map =
        roomIdToParticipants.get(roomId) ?? new Map<string, Participant>();
      map.set(user.id, user);
      roomIdToParticipants.set(roomId, map);

      io.to(roomId).emit('room:participants', getParticipants(roomId));
      io.to(roomId).emit('system:event', { type: 'join', user });
    });

    socket.on('room:leave', () => {
      if (!currentRoomId || !self) return;
      const map = roomIdToParticipants.get(currentRoomId);
      if (map) {
        map.delete(self.id);
        if (map.size === 0) roomIdToParticipants.delete(currentRoomId);
      }
      io.to(currentRoomId).emit(
        'room:participants',
        getParticipants(currentRoomId)
      );
      io.to(currentRoomId).emit('system:event', { type: 'leave', user: self });
      socket.leave(currentRoomId);
      currentRoomId = null;
      self = null;
    });

    socket.on('disconnect', () => {
      if (!currentRoomId || !self) return;
      const map = roomIdToParticipants.get(currentRoomId);
      if (map) {
        map.delete(self.id);
        if (map.size === 0) roomIdToParticipants.delete(currentRoomId);
      }
      io.to(currentRoomId).emit(
        'room:participants',
        getParticipants(currentRoomId)
      );
      io.to(currentRoomId).emit('system:event', { type: 'leave', user: self });
    });

    socket.on(
      'message:send',
      (payload: { roomId: string; author: Participant; content: string }) => {
        const message: MessagePayload = {
          id: crypto.randomUUID(),
          roomId: payload.roomId,
          author: payload.author,
          content: payload.content,
          createdAt: new Date().toISOString(),
        };
        io.to(payload.roomId).emit('message:new', message);
      }
    );

    socket.on('typing:start', (roomId: string, userId: string) => {
      socket.to(roomId).emit('typing:start', { roomId, userId });
    });
    socket.on('typing:stop', (roomId: string, userId: string) => {
      socket.to(roomId).emit('typing:stop', { roomId, userId });
    });
  });
}
