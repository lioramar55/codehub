import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ConnectionStatusComponent } from '../connection-status/connection-status.component';

@Component({
  selector: 'app-chat-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChatSidebarComponent,
    ConnectionStatusComponent,
  ],
  templateUrl: './chat-layout.component.html',
})
export class ChatLayoutComponent implements OnInit, OnDestroy {
  private resizeListener?: () => void;

  // Mobile navigation state
  readonly showSidebar = signal<boolean>(true); // Show by default

  // Computed classes for responsive behavior
  readonly sidebarClasses = computed(() => {
    const isVisible = this.showSidebar();
    const isMobile = window.innerWidth < 768;

    return {
      'fixed inset-0 z-50 md:relative md:z-auto': isMobile,
      'relative z-auto': !isMobile,
      'translate-x-0': isVisible,
      '-translate-x-full': !isVisible && isMobile,
      'transition-transform duration-300 ease-in-out': isMobile,
    };
  });

  readonly overlayClasses = computed(() => {
    const isVisible = this.showSidebar();
    const isMobile = window.innerWidth < 768;

    return {
      'fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden': true,
      'opacity-100': isVisible && isMobile,
      'opacity-0 pointer-events-none': !isVisible || !isMobile,
      'transition-opacity duration-300 ease-in-out': true,
    };
  });

  ngOnInit() {
    // Handle window resize to manage sidebar visibility
    this.resizeListener = () => {
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // On mobile, hide sidebar by default
        this.showSidebar.set(false);
      } else {
        // On desktop/tablet, show sidebar by default
        this.showSidebar.set(true);
      }
    };

    window.addEventListener('resize', this.resizeListener);

    // Set initial state based on screen size
    this.resizeListener();
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  toggleSidebar(): void {
    this.showSidebar.set(!this.showSidebar());
  }

  closeSidebar(): void {
    this.showSidebar.set(false);
  }

  // Auto-hide sidebar on mobile when room is selected
  onRoomSelected(): void {
    if (window.innerWidth < 1024) {
      this.closeSidebar();
    }
  }
}
