import { Component, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Message } from '@codehub/shared-models';

@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './message-item.component.html',
})
export class MessageItemComponent {
  message = input.required<Message>();

  defaultAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }
}
