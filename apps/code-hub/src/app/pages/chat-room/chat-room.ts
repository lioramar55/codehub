import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '@codehub/shared-models';
import { MessageList } from '../../chat-room/message-list/message-list';
import { UserInput } from '../../chat-room/user-input/user-input';
import { ChatRoomHeader } from '../../chat-room/chat-room-header/chat-room-header';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'chat-room',
  imports: [CommonModule, MessageList, UserInput, ChatRoomHeader],
  templateUrl: './chat-room.html',
})
export class ChatRoom {
  private titleService = inject(Title);

  appName = 'CodeHub';

  roomName = signal('Angular Dev Chat');

  messages = signal<Message[]>([
    {
      id: '1',
      author: { id: 'bot', name: 'AngularSensei', isBot: true },
      content:
        'Welcome to the Angular chat room! Ask me anything about Angular 🚀',
      createdAt: new Date(),
    },
    {
      id: '2',
      author: { id: 'u1', name: 'Guest' },
      content: 'How do I use @Input in a child component?',
      createdAt: new Date(),
    },
  ]);

  constructor() {
    effect(() => {
      this.titleService.setTitle(`${this.appName} - ${this.roomName()}`);
    });
  }

  sendMessage = (message: string) => {
    this.messages.update((msgs) => [
      ...msgs,
      {
        id: Date.now().toString(),
        author: { id: 'u1', name: 'Guest' },
        content: message.trim(),
        createdAt: new Date(),
      },
    ]);
  };

  updateRoomName = (newName: string) => {
    this.roomName.set(newName);
  };
}
