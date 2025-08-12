import { Pool, PoolClient, QueryResult } from 'pg';
import { logDbQuery, logDbError } from '../utils/logger';

export class DatabaseLogger {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async query(text: string, params?: any[]): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - startTime;

      logDbQuery(text, params, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logDbError(error as Error, text, params);
      throw error;
    }
  }

  async connect(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async end(): Promise<void> {
    return this.pool.end();
  }

  get totalCount(): number {
    return this.pool.totalCount;
  }

  get idleCount(): number {
    return this.pool.idleCount;
  }

  get waitingCount(): number {
    return this.pool.waitingCount;
  }
}
