import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealtimeGatewayService } from '../../services/realtime-gateway.service';
import { AutoRtlDirective } from '../../directives/auto-rtl.directive';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'message-input',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoRtlDirective],
  templateUrl: './message-input.component.html',
})
export class MessageInput {
  readonly send = output<{
    content: string;
    isSentToBot: boolean;
  }>();
  private readonly realtime = inject(RealtimeGatewayService);
  private readonly chatService = inject(ChatService);

  userId = input.required<string>();

  draft = signal('');
  typing = signal(false);
  isSentToBot = signal(false);
  isToggling = signal(false);

  private typingTimeout!: number;

  onSubmit(e: Event) {
    e.preventDefault();
    const text = this.draft().trim();
    if (!text) return;
    this.send.emit({ content: text, isSentToBot: this.isSentToBot() });
    this.draft.set('');
  }

  async toggleBotMode() {
    if (this.isToggling()) return; // Prevent rapid clicking

    this.isToggling.set(true);
    this.isSentToBot.update((value) => !value);

    // Add a small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 150));
    this.isToggling.set(false);
  }

  onInput() {
    const userId = this.userId();
    const currentRoom = this.chatService.currentRoom();
    if (!userId || !currentRoom) return;

    // Start typing only if not already marked as typing
    if (!this.typing()) {
      this.typing.set(true);
      this.realtime.typingStart(userId, currentRoom.id);
    }

    // Reset stop timer
    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      this.typing.set(false);
      this.realtime.typingStop(userId, currentRoom.id);
    }, 2000); // stop if no input for 2s
  }
}
