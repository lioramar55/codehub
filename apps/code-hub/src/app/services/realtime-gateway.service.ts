import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { User, ChatEvent, Room } from '@codehub/shared-models';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

type Participant = Pick<User, 'id' | 'name'>;

@Injectable({ providedIn: 'root' })
export class RealtimeGatewayService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;
    this.socket = io(environment.socketUrl, { transports: ['websocket'] });
  }

  // Room management
  getRooms(): void {
    this.socket?.emit('rooms:get');
  }

  joinRoom(user: Participant, roomId: string): void {
    this.socket?.emit('room:join', { user, roomId });
  }

  leaveRoom(): void {
    this.socket?.emit('room:leave');
  }

  createOrUpdateUser(user: User) {
    this.socket?.emit('system:user', { user });
  }

  onRoomsList(): Observable<Room[]> {
    return new Observable((sub) => {
      this.socket?.on('rooms:list', (rooms: Room[]) => sub.next(rooms));
      return () => this.socket?.off('rooms:list');
    });
  }

  onParticipants(): Observable<Participant[]> {
    return new Observable((sub) => {
      this.socket?.on('room:participants', (list: Participant[]) =>
        sub.next(list)
      );
      return () => this.socket?.off('room:participants');
    });
  }

  onSystemEvents(): Observable<{ type: 'join' | 'leave'; user: Participant }> {
    return new Observable((sub) => {
      this.socket?.on('system:event', (e) => sub.next(e));
      return () => this.socket?.off('system:event');
    });
  }

  // Message handling
  sendMessage(author: Participant, content: string, roomId: string): void {
    this.socket?.emit('message:send', { author, content, roomId });
  }

  onMessageNew(): Observable<ChatEvent> {
    return new Observable((sub) => {
      this.socket?.on('message:new', (m: ChatEvent) => sub.next(m));
      return () => this.socket?.off('message:new');
    });
  }

  onRoomHistory(): Observable<ChatEvent[]> {
    return new Observable((sub) => {
      this.socket?.on('room:history', (history: ChatEvent[]) =>
        sub.next(history)
      );
      return () => this.socket?.off('room:history');
    });
  }

  // Typing indicators
  typingStart(userId: string, roomId: string): void {
    this.socket?.emit('typing:start', { userId, roomId });
  }

  typingStop(userId: string, roomId: string): void {
    this.socket?.emit('typing:stop', { userId, roomId });
  }

  onTypingStart(): Observable<{ userId: string }> {
    return new Observable((sub) => {
      this.socket?.on('typing:start', (p) => sub.next(p));
      return () => this.socket?.off('typing:start');
    });
  }

  onTypingStop(): Observable<{ userId: string }> {
    return new Observable((sub) => {
      this.socket?.on('typing:stop', (p) => sub.next(p));
      return () => this.socket?.off('typing:stop');
    });
  }

  // Error handling
  onError(): Observable<{ message: string }> {
    return new Observable((sub) => {
      this.socket?.on('error', (error) => sub.next(error));
      return () => this.socket?.off('error');
    });
  }
}
