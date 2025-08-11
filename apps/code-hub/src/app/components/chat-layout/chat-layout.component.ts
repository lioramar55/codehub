import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatSidebarComponent],
  templateUrl: './chat-layout.component.html',
})
export class ChatLayoutComponent {}
