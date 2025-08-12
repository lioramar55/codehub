import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatEvent } from '@codehub/shared-models';
import { MessageItem } from '../message-item/message-item.component';

@Component({
  selector: 'message-list',
  standalone: true,
  imports: [CommonModule, MessageItem],
  templateUrl: './message-list.component.html',
})
export class MessageList {
  currentUserId = input.required<string>();
  messages = input.required<ChatEvent[]>();

  trackById = (_: number, m: ChatEvent) => m.id;
}
