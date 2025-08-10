import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-layout.component.html',
  styles: [
    `
    .input {
      @apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
    }
  `,
  ],
})
export class ChatLayoutComponent {
  protected chat = inject(ChatService);
  protected userService = inject(UserService);

  editProfile = false;

  readonly user = this.userService.currentUser;
  readonly rooms = this.chat.rooms;

  onNameChange(e: Event) {
    const value = (e.target as HTMLInputElement).value.trim();
    if (value) this.userService.updateUser({ name: value });
  }
  onAvatarChange(e: Event) {
    const value = (e.target as HTMLInputElement).value.trim();
    this.userService.updateUser({ avatarUrl: value || undefined });
  }
}


