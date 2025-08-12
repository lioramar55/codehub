import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RealtimeGatewayService } from './services/realtime-gateway.service';
import { KeepAliveService } from './services/keep-alive.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App implements OnInit, OnDestroy {
  protected title = 'Code Hub';

  private realtimeService = inject(RealtimeGatewayService);
  private keepAliveService = inject(KeepAliveService);

  ngOnInit() {
    // Start keep-alive service to prevent Railway from sleeping
    this.keepAliveService.startKeepAlive();

    // Connect to WebSocket
    this.realtimeService.connect();

    // Monitor connection status using signals
    console.log(
      'WebSocket connection status:',
      this.realtimeService.connectionStatus()
    );
  }

  ngOnDestroy() {
    this.keepAliveService.stopKeepAlive();
    this.realtimeService.disconnect();
  }
}
