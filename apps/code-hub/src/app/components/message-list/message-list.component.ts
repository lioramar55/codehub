import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatEvent } from '@codehub/shared-models';
import { MessageItemComponent } from '../message-item/message-item.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageItemComponent],
  templateUrl: './message-list.component.html',
})
export class MessageListComponent {
  currentUserId = input.required<string>();
  messages = input.required<ChatEvent[]>();

  trackById = (_: number, m: ChatEvent) => m.id;
}
