import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '@codehub/shared-models';
import { MessageItem } from '../message-item/message-item';

@Component({
  selector: 'message-list',
  imports: [CommonModule, MessageItem],
  templateUrl: './message-list.html',
})
export class MessageList {
  @Input() messages: Message[] = [];
}
