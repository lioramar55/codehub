import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './chat-layout.component.html',
})
export class ChatLayoutComponent {}
