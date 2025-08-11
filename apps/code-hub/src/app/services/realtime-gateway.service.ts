import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { User, Message } from '@codehub/shared-models';
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

  joinRoom(user: Participant) {
    this.socket?.emit('room:join', { user });
  }

  leaveRoom() {
    this.socket?.emit('room:leave');
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

  sendMessage(author: Participant, content: string) {
    this.socket?.emit('message:send', { author, content });
  }

  onMessageNew(): Observable<Message> {
    return new Observable((sub) => {
      this.socket?.on('message:new', (m: Message) => sub.next(m));
      return () => this.socket?.off('message:new');
    });
  }

  typingStart(userId: string) {
    this.socket?.emit('typing:start', userId);
  }

  typingStop(userId: string) {
    this.socket?.emit('typing:stop', userId);
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
}
