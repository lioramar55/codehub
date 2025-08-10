import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '@codehub/shared-models';
import { MessageItemComponent } from '../message-item/message-item.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageItemComponent],
  templateUrl: './message-list.component.html',
})
export class MessageListComponent {
  messages = input.required<Message[]>();

  trackById = (_: number, m: Message) => m.id;
}
