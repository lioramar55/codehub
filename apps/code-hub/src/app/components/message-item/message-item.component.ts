import { Component, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AutoRtlDirective } from '../../directives/auto-rtl.directive';
import { Message, SystemMessage } from '@codehub/shared-models';

@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, AutoRtlDirective],
  templateUrl: './message-item.component.html',
})
export class MessageItemComponent {
  message = input<Message | null>(null);
  system = input<SystemMessage | null>(null);
  currentUserId = input.required<string>();

  defaultAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }
}
