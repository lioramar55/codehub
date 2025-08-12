import { Injectable, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { User, ChatEvent, Room } from '@codehub/shared-models';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ConnectionStatus } from '../types/connection-status.enum';

type Participant = Pick<User, 'id' | 'name'>;

@Injectable({ providedIn: 'root' })
export class RealtimeGatewayService {
  private socket: Socket | null = null;
  private keepAliveInterval: any = null;
  private pendingEvents: Array<{ event: string; data: any }> = [];
  private _isReconnecting = false;

  // Modern Angular signals
  readonly connectionStatus = signal<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  readonly isConnected = computed(
    () => this.connectionStatus() === ConnectionStatus.CONNECTED
  );
  readonly isConnecting = computed(
    () => this.connectionStatus() === ConnectionStatus.CONNECTING
  );
  readonly isReconnecting = computed(
    () => this.connectionStatus() === ConnectionStatus.RECONNECTING
  );

  connect() {
    if (this.socket) return;

    if (!environment.socketUrl) {
      console.error(
        'Socket URL is not configured. Please check your environment configuration.'
      );
      return;
    }

    this.connectionStatus.set(ConnectionStatus.CONNECTING);
    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000, // try every 2 seconds
      timeout: 10000,
      forceNew: true,
    });

    this.setupSocketEventHandlers();
    this.startKeepAlive();
  }

  private setupSocketEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.connectionStatus.set(ConnectionStatus.CONNECTED);
      this._isReconnecting = false;

      // Send pending events that were queued during disconnection
      this.flushPendingEvents();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
      this.connectionStatus.set(ConnectionStatus.DISCONNECTED);

      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionStatus.set(ConnectionStatus.DISCONNECTED);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(
        'Reconnected to socket server after',
        attemptNumber,
        'attempts'
      );
      this.connectionStatus.set(ConnectionStatus.CONNECTED);
      this._isReconnecting = false;

      // Re-join room and send pending events
      this.flushPendingEvents();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect...', attemptNumber);
      this.connectionStatus.set(ConnectionStatus.RECONNECTING);
      this._isReconnecting = true;
    });
  }

  private startKeepAlive() {
    // Send ping every 30 seconds to keep connection alive
    this.keepAliveInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
      }
    }, 30000);
  }

  private queueEvent(event: string, data: any) {
    this.pendingEvents.push({ event, data });
    // Keep only last 10 events to avoid memory issues
    if (this.pendingEvents.length > 10) {
      this.pendingEvents.shift();
    }
  }

  private flushPendingEvents() {
    if (!this.socket?.connected || this.pendingEvents.length === 0) return;

    console.log('Flushing', this.pendingEvents.length, 'pending events');

    while (this.pendingEvents.length > 0) {
      const event = this.pendingEvents.shift();
      if (event) {
        this.socket?.emit(event.event, event.data);
      }
    }
  }

  // Room management
  getRooms(): void {
    if (this.socket?.connected) {
      this.socket.emit('rooms:get');
    } else {
      this.queueEvent('rooms:get', {});
    }
  }

  joinRoom(user: Participant, roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('room:join', { user, roomId });
    } else {
      this.queueEvent('room:join', { user, roomId });
    }
  }

  leaveRoom(): void {
    if (this.socket?.connected) {
      this.socket.emit('room:leave');
    } else {
      this.queueEvent('room:leave', {});
    }
  }

  createOrUpdateUser(user: User) {
    if (this.socket?.connected) {
      this.socket.emit('system:user', { user });
    } else {
      this.queueEvent('system:user', { user });
    }
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
  sendMessage(
    author: Participant,
    content: string,
    roomId: string,
    isSentToBot = false
  ): void {
    if (this.socket?.connected) {
      this.socket.emit('message:send', {
        author,
        content,
        roomId,
        isSentToBot,
      });
    } else {
      this.queueEvent('message:send', { author, content, roomId, isSentToBot });
    }
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
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { userId, roomId });
    } else {
      this.queueEvent('typing:start', { userId, roomId });
    }
  }

  typingStop(userId: string, roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { userId, roomId });
    } else {
      this.queueEvent('typing:stop', { userId, roomId });
    }
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

  // Manual reconnection method
  reconnect() {
    console.log('Manual reconnection requested');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connect();
  }

  // Cleanup
  disconnect() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionStatus.set(ConnectionStatus.DISCONNECTED);
    this.pendingEvents = [];
  }
}
