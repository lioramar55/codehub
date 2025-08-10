import { Component, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MessageListComponent,
    MessageInputComponent,
  ],
  templateUrl: './chat-room.component.html',
})
export class ChatRoomComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly chat = inject(ChatService);
  private readonly userService = inject(UserService);

  readonly roomId = signal<string>('general');
  readonly messages = this.chat.messages;

  constructor() {
    this.route.paramMap.subscribe((pm) => {
      const id = pm.get('roomId') ?? 'general';
      this.roomId.set(id);
      this.chat.setActiveRoom(id);
    });
  }

  onSendText(text: string) {
    this.chat.sendMessage(this.userService.currentUser(), text);
  }

  defaultAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }
}
