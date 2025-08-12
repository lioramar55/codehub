import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealtimeGatewayService } from '../../services/realtime-gateway.service';
import { KeepAliveService } from '../../services/keep-alive.service';
import { ConnectionStatus } from '../../types/connection-status.enum';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-status.component.html',
})
export class ConnectionStatusComponent {
  private realtimeService = inject(RealtimeGatewayService);
  private keepAliveService = inject(KeepAliveService);

  readonly connectionStatus = this.realtimeService.connectionStatus;
  readonly ConnectionStatus = ConnectionStatus; // Make enum available in template

  async reconnect() {
    await this.keepAliveService.checkHealth();
    this.realtimeService.reconnect();
  }
}
