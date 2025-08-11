import { Component, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AutoRtlDirective } from '../../directives/auto-rtl.directive';
import { ChatEvent } from '@codehub/shared-models';

@Component({
  selector: 'app-message-item',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, AutoRtlDirective],
  templateUrl: './message-item.component.html',
})
export class MessageItemComponent {
  event = input.required<ChatEvent>();
  currentUserId = input.required<string>();

  defaultAvatar(seed: string) {
    return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
      seed
    )}`;
  }
}
