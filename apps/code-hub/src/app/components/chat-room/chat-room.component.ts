import { Component, inject, linkedSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, MessageListComponent, MessageInputComponent],
  templateUrl: './chat-room.component.html',
})
export class ChatRoomComponent {
  private readonly chat = inject(ChatService);
  private readonly userService = inject(UserService);

  readonly participants = linkedSignal(this.chat.participants);
  readonly currentUser = linkedSignal(this.userService.currentUser);
  readonly timeline = linkedSignal(this.chat.timeline);
  readonly typingNames = linkedSignal(this.chat.typingNames);

  onSendText(text: string) {
    this.chat.sendMessage(text);
  }

  defaultAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }
}
