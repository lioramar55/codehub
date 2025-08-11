import {
  Component,
  inject,
  signal,
  computed,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ThemeService } from '../../services/theme.service';
import { Room } from '@codehub/shared-models';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-sidebar.component.html',
})
export class ChatSidebarComponent {
  private chatService = inject(ChatService);
  private router = inject(Router);
  readonly theme = inject(ThemeService);

  @Output() roomSelected = new EventEmitter<void>();

  // Signals
  readonly rooms = this.chatService.availableRooms;
  readonly currentRoom = this.chatService.currentRoom;
  readonly filterText = signal<string>('');
  readonly isCreatingRoom = signal<boolean>(false);
  readonly newRoomName = signal<string>('');

  // Computed
  readonly filteredRooms = computed(() => {
    const filter = this.filterText().toLowerCase();
    const roomsList = this.rooms();

    if (!filter) return roomsList;

    return roomsList.filter((room) => room.name.toLowerCase().includes(filter));
  });

  // Methods
  selectRoom(room: Room): void {
    this.chatService.joinRoom(room);
    this.router.navigate(['/chat', room.id]);
    this.roomSelected.emit();
  }

  startCreatingRoom(): void {
    this.isCreatingRoom.set(true);
    this.newRoomName.set('');
  }

  cancelCreatingRoom(): void {
    this.isCreatingRoom.set(false);
    this.newRoomName.set('');
  }

  createRoom(): void {
    const name = this.newRoomName().trim();
    if (name) {
      this.chatService.createRoom(name);
      this.cancelCreatingRoom();
      this.roomSelected.emit();
    }
  }

  clearFilter(): void {
    this.filterText.set('');
  }

  isRoomActive(room: Room): boolean {
    return this.currentRoom()?.id === room.id;
  }
}
