import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealtimeGatewayService } from '../../services/realtime-gateway.service';
import { KeepAliveService } from '../../services/keep-alive.service';
import { ConnectionStatus as ConnectionStatusEnum } from '../../types/connection-status.enum';

@Component({
  selector: 'connection-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './connection-status.component.html',
})
export class ConnectionStatus {
  private realtimeService = inject(RealtimeGatewayService);
  private keepAliveService = inject(KeepAliveService);

  readonly connectionStatus = this.realtimeService.connectionStatus;
  readonly ConnectionStatus = ConnectionStatusEnum; // Make enum available in template

  async reconnect() {
    await this.keepAliveService.checkHealth();
    this.realtimeService.reconnect();
  }
}
