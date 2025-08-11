import {
  Component,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  linkedSignal,
  signal,
  viewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { Room } from '@codehub/shared-models';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, MessageListComponent, MessageInputComponent],
  templateUrl: './chat-room.component.html',
})
export class ChatRoomComponent implements OnInit {
  private readonly chat = inject(ChatService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly theme = inject(ThemeService);
  private readonly nearBottomThresholdPx = 360;

  // Reference to the scrollable container
  readonly scrollable = viewChild<ElementRef<HTMLElement>>('scrollable');

  // Tracks whether the user is near the bottom, to decide if we should auto-scroll on new messages
  readonly isUserNearBottom = signal(true);

  // Ensures we always scroll on the next message change, e.g. when we send a message
  readonly forceScrollNextChange = signal(false);

  readonly participants = linkedSignal(this.chat.participants);
  readonly currentUser = linkedSignal(this.userService.currentUser);
  readonly messages = linkedSignal(this.chat.messages);
  readonly typingNames = linkedSignal(this.chat.typingNames);
  readonly currentRoom = linkedSignal(this.chat.currentRoom);

  ngOnInit() {
    // Subscribe to route params to handle room navigation
    this.route.params.subscribe((params) => {
      const roomId = params['roomId'];
      if (roomId) {
        this.joinRoomById(roomId);
      }
    });
  }

  private joinRoomById(roomId: string) {
    const rooms = this.chat.availableRooms();
    const room = rooms.find((r) => r.id === roomId);

    if (room) {
      this.chat.joinRoom(room);
    } else {
      // Room not found, redirect to default chat
      this.router.navigate(['/chat']);
    }
  }

  onSendText(text: string) {
    // Always scroll when I am the sender
    this.forceScrollNextChange.set(true);
    this.chat.sendMessage(text);
  }

  defaultAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }

  // Wire up scroll tracking and auto-scroll behavior
  constructor() {
    // After the next render, register scroll listener and perform initial scroll
    afterNextRender(() => {
      const el = this.scrollable()?.nativeElement;
      if (!el) return;

      const updateNearBottom = () => {
        const distanceFromBottom =
          el.scrollHeight - (el.scrollTop + el.clientHeight);
        this.isUserNearBottom.set(
          distanceFromBottom <= this.nearBottomThresholdPx
        );
      };

      el.addEventListener('scroll', updateNearBottom, { passive: true });
      // Initial state and scroll to bottom on first render
      updateNearBottom();
      this.scrollToBottom();

      // Cleanup on destroy
      return () => el.removeEventListener('scroll', updateNearBottom);
    });

    // Auto-scroll when timeline changes if needed
    effect(() => {
      // react to changes in message count/order
      const length = this.messages().length;
      if (length === 0) return;

      const shouldScroll =
        this.forceScrollNextChange() || this.isUserNearBottom();
      if (!shouldScroll) return;

      // Defer until DOM updates
      setTimeout(() => this.scrollToBottom());
      this.forceScrollNextChange.set(false);
    });
  }

  private scrollToBottom() {
    const el = this.scrollable()?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  toggleTheme() {
    this.theme.toggle();
  }
}
