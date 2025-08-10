import { Injectable, signal, computed } from '@angular/core';
import { Message, User } from '@codehub/shared-models';

export interface ChatSummary {
  id: string;
  name: string;
  lastMessage?: Message;
  unreadCount?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly now = () => new Date();

  // Mock rooms
  private readonly roomsSignal = signal<ChatSummary[]>([
    { id: 'general', name: 'General' },
    { id: 'angular', name: 'Angular' },
    { id: 'random', name: 'Random' },
  ]);

  // Active room id
  readonly activeRoomId = signal<string>('general');

  // Messages per room (mock store)
  private readonly roomIdToMessages = signal<Record<string, Message[]>>({
    general: [],
    angular: [],
    random: [],
  });

  readonly rooms = computed(() => this.roomsSignal());
  readonly messages = computed<Message[]>(() => {
    const all = this.roomIdToMessages();
    return all[this.activeRoomId()] ?? [];
  });

  // Simple bot user
  readonly bot: User = {
    id: 'bot-angular-guru',
    name: 'Ng Wizard',
    isBot: true,
    avatarUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=angular`,
  } as User;

  constructor() {
    // Seed with a welcome message
    const welcome: Message = {
      id: crypto.randomUUID(),
      roomId: 'general',
      author: this.bot,
      content: 'Welcome to Code Hub! Ask me anything about Angular.',
      createdAt: this.now(),
    };
    const map = { ...this.roomIdToMessages() };
    map['general'] = [welcome];
    this.roomIdToMessages.set(map);
  }

  setActiveRoom(roomId: string) {
    this.activeRoomId.set(roomId);
  }

  sendMessage(author: User, content: string) {
    const msg: Message = {
      id: crypto.randomUUID(),
      roomId: this.activeRoomId(),
      author,
      content,
      createdAt: this.now(),
    };
    const map = { ...this.roomIdToMessages() };
    const list = map[this.activeRoomId()] ?? [];
    map[this.activeRoomId()] = [...list, msg];
    this.roomIdToMessages.set(map);

    // Trigger bot if Angular mentioned
    if (/\b(angular|ng|rxjs|zone\.js|change detection)\b/i.test(content)) {
      this.enqueueBotReply(content);
    }
  }

  private enqueueBotReply(userText: string) {
    const thinking: Message = {
      id: crypto.randomUUID(),
      roomId: this.activeRoomId(),
      author: this.bot,
      content: '🤖 Thinking…',
      createdAt: this.now(),
    };
    this.append(thinking);

    setTimeout(() => {
      const reply: Message = {
        id: crypto.randomUUID(),
        roomId: this.activeRoomId(),
        author: this.bot,
        content: this.generateAngularAnswer(userText),
        createdAt: this.now(),
      };
      this.replace(thinking.id, reply);
    }, 800);
  }

  private append(message: Message) {
    const map = { ...this.roomIdToMessages() };
    const list = map[this.activeRoomId()] ?? [];
    map[this.activeRoomId()] = [...list, message];
    this.roomIdToMessages.set(map);
  }

  private replace(messageId: string, replacement: Message) {
    const map = { ...this.roomIdToMessages() };
    const roomId = this.activeRoomId();
    map[roomId] = (map[roomId] ?? []).map((m) =>
      m.id === messageId ? replacement : m
    );
    this.roomIdToMessages.set(map);
  }

  private generateAngularAnswer(q: string): string {
    const lower = q.toLowerCase();
    if (lower.includes('change detection')) {
      return 'Angular uses zone-less or zone.js-driven change detection. Prefer signals and OnPush-style patterns for efficient rendering. Use computed() and effect() for derived state and side-effects.';
    }
    if (lower.includes('rxjs')) {
      return 'RxJS powers async streams. Use takeUntilDestroyed(), shareReplay({ refCount: true, bufferSize: 1 }), and switchMap for composing HTTP + UI. Prefer signals interop when possible.';
    }
    if (lower.includes('routing') || lower.includes('route')) {
      return 'Use provideRouter() with standalone components, lazy-load via loadComponent, and define feature routes close to features. Keep resolvers lean; prefer guards for auth checks.';
    }
    if (lower.includes('forms')) {
      return 'Angular forms: template-driven for simple cases, reactive forms for complex state. With v17+, consider typed forms and control flow template syntax for clarity.';
    }
    return "Pro tip: Embrace Angular's standalone components and signals. Keep components presentational; push side-effects to services. Use Nx to enforce boundaries.";
  }
}
