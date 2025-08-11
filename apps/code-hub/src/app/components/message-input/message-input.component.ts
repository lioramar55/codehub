import {
  Component,
  EventEmitter,
  Output,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealtimeGatewayService } from '../../services/realtime-gateway.service';
import { AutoRtlDirective } from '../../directives/auto-rtl.directive';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoRtlDirective],
  templateUrl: './message-input.component.html',
})
export class MessageInputComponent {
  @Output() send = new EventEmitter<string>();
  private readonly realtime = inject(RealtimeGatewayService);

  userId = input.required<string>();

  draft = signal('');
  typing = signal(false);

  private typingTimeout!: number;

  onSubmit(e: Event) {
    e.preventDefault();
    const text = this.draft().trim();
    if (!text) return;
    this.send.emit(text);
    this.draft.set('');
  }

  onInput() {
    const userId = this.userId();
    if (!userId) return;

    // Start typing only if not already marked as typing
    if (!this.typing()) {
      this.typing.set(true);
      this.realtime.typingStart(userId);
    }

    // Reset stop timer
    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      this.typing.set(false);
      this.realtime.typingStop(userId);
    }, 2000); // stop if no input for 2s
  }
}
