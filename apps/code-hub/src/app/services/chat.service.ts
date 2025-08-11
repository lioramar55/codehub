import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatEvent } from '@codehub/shared-models';
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

    this.realtime.joinRoom(this.userService.currentUser());

    this.realtime.onMessageNew().subscribe((m) => {
      if (
        m.type === 'system' &&
        m.user?.id === this.userService.currentUser().id
      )
        return;
      this.messages.set([...this.messages(), m]);
    });

    this.realtime.onParticipants().subscribe((list) => {
      this.participants.set(list);
    });

    // this.realtime.onSystemEvents().subscribe((e) => {
    //   if (e.user.id === this.userService.currentUser().id) return;

    //   const event: ChatEvent = {
    //     id: crypto.randomUUID(),
    //     type: 'system',
    //     kind: e.type,
    //     user: e.user,
    //     createdAt: new Date().toISOString(),
    //   };

    //   this.systemMessages.set([...this.systemMessages(), event]);
    // });

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
  }

  sendMessage(content: string) {
    this.realtime.sendMessage(this.userService.currentUser(), content);
  }
}
