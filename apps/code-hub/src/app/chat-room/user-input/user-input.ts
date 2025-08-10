import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'user-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-input.html',
})
export class UserInput {
  message = signal('');
  sendMessage = output<string>();

  handleSend() {
    if (!this.message().trim()) return;
    this.sendMessage.emit(this.message());
    this.message.set('');
  }
}
