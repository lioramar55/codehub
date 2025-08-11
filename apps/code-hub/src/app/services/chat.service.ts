import { Injectable, signal, computed, inject } from '@angular/core';
import { Message, SystemMessage } from '@codehub/shared-models';
import { RealtimeGatewayService } from './realtime-gateway.service';
import { UserService } from './user.service';

export interface ParticipantSummary {
  id: string;
  name: string;
}

export type ChatEntry =
  | { type: 'system'; createdAt: string; system: SystemMessage }
  | { type: 'message'; createdAt: string; message: Message };

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly realtime = inject(RealtimeGatewayService);

  // Messages per room (mock store)
  private readonly typingUserIds = signal<Set<string>>(new Set());
  private readonly typingTimeouts = new Map<string, number>();

  readonly messages = signal<Message[]>([]);
  readonly systemMessages = signal<SystemMessage[]>([]);

  readonly participants = signal<ParticipantSummary[]>([]);
  readonly typingNames = computed<string[]>(() => {
    const ids = this.typingUserIds();
    const list = this.participants();
    return list.filter((p) => ids.has(p.id)).map((p) => p.name);
  });

  readonly timeline = computed<ChatEntry[]>(() => {
    const sys = this.systemMessages().map((s) => ({
      type: 'system' as const,
      createdAt: s.createdAt,
      system: s,
    }));

    const msgs = this.messages().map((m) => ({
      type: 'message' as const,
      createdAt: m.createdAt,
      message: m,
    }));

    return [...sys, ...msgs].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    );
  });

  constructor() {
    this.realtime.connect();

    this.realtime.joinRoom(this.userService.currentUser());

    this.realtime.onMessageNew().subscribe((m) => {
      this.messages.set([...this.messages(), m]);
    });

    this.realtime.onParticipants().subscribe((list) => {
      this.participants.set(list);
    });

    this.realtime.onSystemEvents().subscribe((e) => {
      if (e.user.id === this.userService.currentUser().id) return;

      const systemMessage: SystemMessage = {
        id: crypto.randomUUID(),
        kind: e.type,
        user: e.user,
        createdAt: new Date().toISOString(),
      };

      this.systemMessages.set([...this.systemMessages(), systemMessage]);
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
  }

  private userService = inject(UserService);

  sendMessage(content: string) {
    this.realtime.sendMessage(this.userService.currentUser(), content);
  }
}
