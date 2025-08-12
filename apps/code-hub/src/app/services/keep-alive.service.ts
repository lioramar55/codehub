import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class KeepAliveService {
  private keepAliveInterval: any = null;

  /**
   * Start automatic keep-alive pings to prevent Railway from sleeping
   * Only runs in production and pings every 5 minutes
   */
  startKeepAlive() {
    if (this.keepAliveInterval) {
      return; // Already running
    }

    // Only run in production to prevent Railway from sleeping
    if (!environment.production) {
      return;
    }

    console.log('Starting keep-alive service (pings every 5 minutes)');

    // Ping the health endpoint every 5 minutes to keep the server alive
    this.keepAliveInterval = setInterval(async () => {
      await this.pingHealth();
    }, 300000); // 5 minutes

    // Initial ping
    this.pingHealth();
  }

  /**
   * Stop the keep-alive service
   */
  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      console.log('Keep-alive service stopped');
    }
  }

  /**
   * Manual health check - can be called from anywhere
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${environment.socketUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const isHealthy = response.ok;

      if (isHealthy) {
        console.log('Health check: OK');
      } else {
        console.warn('Health check failed:', response.status);
      }

      return isHealthy;
    } catch (error) {
      console.warn('Health check error:', error);
      return false;
    }
  }

  /**
   * Internal ping method used by keep-alive
   */
  private async pingHealth() {
    const isHealthy = await this.checkHealth();

    if (isHealthy) {
      console.log('Keep-alive ping successful');
    } else {
      console.warn('Keep-alive ping failed');
    }
  }
}
