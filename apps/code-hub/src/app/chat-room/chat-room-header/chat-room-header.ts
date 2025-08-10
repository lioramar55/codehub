import {
  Component,
  DOCUMENT,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'chat-room-header',
  imports: [CommonModule],
  templateUrl: './chat-room-header.html',
})
export class ChatRoomHeader {
  private document = inject(DOCUMENT);
  private location = inject(Location);

  roomName = input<string>('');
  roomNameChanged = output<string>();

  isEditing = signal(false);

  enableEdit() {
    this.isEditing.set(true);
  }

  saveRoomName(newName: string) {
    newName = newName.trim();
    if (newName) {
      this.roomNameChanged.emit(newName);
    }
    this.isEditing.set(false);
  }

  createNewRoom = () => {
    // TODO: Implement logic to create a new chat room
  };

  copyLink = () => {
    const fullUrl = this.document.location.origin + this.location.path();
    if (this.document.defaultView?.navigator?.clipboard) {
      this.document.defaultView.navigator.clipboard.writeText(fullUrl);
    }
  };
}
