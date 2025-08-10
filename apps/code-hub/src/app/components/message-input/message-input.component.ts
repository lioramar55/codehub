import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './message-input.component.html',
})
export class MessageInputComponent {
  @Output() send = new EventEmitter<string>();
  draft = '';

  onSubmit(e: Event) {
    e.preventDefault();
    const text = this.draft.trim();
    if (!text) return;
    this.send.emit(text);
    this.draft = '';
  }
}
