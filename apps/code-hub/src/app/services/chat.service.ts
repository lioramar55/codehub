import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatEvent, Room } from '@codehub/shared-models';
import { RealtimeGatewayService } from './realtime-gateway.service';
import { UserService } from './user.service';

export interface ParticipantSummary {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly realtime = inject(RealtimeGatewayService);
  private userService = inject(UserService);

  // Room management
  readonly availableRooms = signal<Room[]>([]);
  readonly currentRoom = signal<Room | null>(null);

  // Messages per room (mock store)
  private readonly typingUserIds = signal<Set<string>>(new Set());
  private readonly typingTimeouts = new Map<string, number>();

  readonly messages = signal<ChatEvent[]>([]);
  readonly participants = signal<ParticipantSummary[]>([]);

  readonly typingNames = computed<string[]>(() => {
    const ids = this.typingUserIds();
    const list = this.participants();
    return list.filter((p) => ids.has(p.id)).map((p) => p.name);
  });

  constructor() {
    this.realtime.connect();
    this.setupEventListeners();
    this.loadRooms();
  }

  private setupEventListeners() {
    // Room events
    this.realtime.onRoomsList().subscribe((rooms) => {
      this.availableRooms.set(rooms);
      // Auto-join general room if no current room
      if (!this.currentRoom() && rooms.length > 0) {
        this.joinRoom(rooms[0]);
      }
    });

    this.realtime.onMessageNew().subscribe((m) => {
      if (
        m.type === 'system' &&
        m.user?.id === this.userService.currentUser().id
      )
        return;
      this.messages.set([...this.messages(), m]);
    });

    this.realtime.onRoomHistory().subscribe((history) => {
      this.messages.set(history);
    });

    this.realtime.onParticipants().subscribe((list) => {
      this.participants.set(list);
    });

    this.realtime.onTypingStart().subscribe(({ userId }) => {
      const set = new Set(this.typingUserIds());
      set.add(userId);
      this.typingUserIds.set(set);

      clearTimeout(this.typingTimeouts.get(userId));

      const tid = setTimeout(() => {
        const s2 = new Set(this.typingUserIds());
        s2.delete(userId);
        this.typingUserIds.set(s2);
      }, 3000);

      this.typingTimeouts.set(userId, tid);
    });

    this.realtime.onTypingStop().subscribe(({ userId }) => {
      const set = new Set(this.typingUserIds());
      set.delete(userId);
      this.typingUserIds.set(set);
      clearTimeout(this.typingTimeouts.get(userId));
    });

    this.realtime.onError().subscribe((error) => {
      console.error('Socket error:', error);
    });
  }

  loadRooms(): void {
    this.realtime.getRooms();
  }

  joinRoom(room: Room): void {
    const currentRoom = this.currentRoom();
    if (currentRoom?.id === room.id) return;

    // Leave current room if any
    if (currentRoom) {
      this.realtime.leaveRoom();
    }

    this.currentRoom.set(room);
    this.messages.set([]); // Clear messages for new room
    this.participants.set([]); // Clear participants for new room

    this.realtime.joinRoom(this.userService.currentUser(), room.id);
  }

  sendMessage(content: string): void {
    const currentRoom = this.currentRoom();
    if (!currentRoom) return;

    this.realtime.sendMessage(
      this.userService.currentUser(),
      content,
      currentRoom.id
    );
  }

  startTyping(): void {
    const currentRoom = this.currentRoom();
    if (!currentRoom) return;

    this.realtime.typingStart(
      this.userService.currentUser().id,
      currentRoom.id
    );
  }

  stopTyping(): void {
    const currentRoom = this.currentRoom();
    if (!currentRoom) return;

    this.realtime.typingStop(this.userService.currentUser().id, currentRoom.id);
  }
}
