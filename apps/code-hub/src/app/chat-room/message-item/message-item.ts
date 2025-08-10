import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message, User } from '@codehub/shared-models';

@Component({
  selector: 'message-item',
  imports: [CommonModule],
  templateUrl: './message-item.html',
})
export class MessageItem implements OnInit {
  @Input({ required: true }) message!: Message;

  activeUser = signal<User>({
    id: 'u1',
    name: 'Guest',
    isBot: false,
  });

  isSentByActiveUser = signal(false);
  isBot = signal(false);

  ngOnInit() {
    this.isSentByActiveUser.set(
      this.message.author.id === this.activeUser().id
    );
    this.isBot.set(!!this.message.author.isBot);
  }
}
