import { pool, closePool, initializeDatabase } from './db';
import { logInfo, logError } from '../utils/logger';

// Mock dependencies
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

// Mock the logger
jest.mock('../utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
}));

describe('Database Service', () => {
  let mockPool: any;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn().mockResolvedValue(undefined),
    };

    // Mock the pool instance
    (pool as any) = mockPool;
  });

  describe('closePool', () => {
    it('should close the database pool', async () => {
      await closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should log pool closing messages', async () => {
      await closePool();

      expect(logInfo).toHaveBeenCalledWith(
        'Closing database connection pool...'
      );
      expect(logInfo).toHaveBeenCalledWith(
        'Database connection pool closed successfully'
      );
    });

    it('should handle pool close errors gracefully', async () => {
      const error = new Error('Pool close error');
      mockPool.end.mockRejectedValue(error);

      await expect(closePool()).rejects.toThrow('Pool close error');
    });
  });

  describe('initializeDatabase', () => {
    it('should create all required tables successfully', async () => {
      // Mock successful query responses
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      // Verify users table creation
      expect(mockClient.query).toHaveBeenCalledWith(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        is_bot BOOLEAN DEFAULT FALSE
      )
    `);

      // Verify rooms table creation
      expect(mockClient.query).toHaveBeenCalledWith(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);

      // Verify messages table creation
      expect(mockClient.query).toHaveBeenCalledWith(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        content TEXT,
        kind VARCHAR(50),
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
        room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_sent_to_bot BOOLEAN DEFAULT FALSE
      )
    `);

      // Verify index creation
      expect(mockClient.query).toHaveBeenCalledWith(`
      CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at 
      ON messages(room_id, created_at DESC)
    `);

      // Verify client was released
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should log initialization and success messages', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      expect(logInfo).toHaveBeenCalledWith('Initializing database...');
      expect(logInfo).toHaveBeenCalledWith('Database initialized successfully');
    });

    it('should handle database connection errors', async () => {
      const error = new Error('Connection error');
      mockPool.connect.mockRejectedValue(error);

      await expect(initializeDatabase()).rejects.toThrow('Connection error');
    });

    it('should handle query errors and log them', async () => {
      const error = new Error('Query error');
      mockClient.query.mockRejectedValue(error);

      await expect(initializeDatabase()).rejects.toThrow('Query error');
      expect(logError).toHaveBeenCalledWith(error, 'Database initialization');
    });

    it('should release client even if query fails', async () => {
      const error = new Error('Query error');
      mockClient.query.mockRejectedValue(error);

      try {
        await initializeDatabase();
      } catch (e) {
        // Expected to fail
      }

      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle client release errors gracefully', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });
      const releaseError = new Error('Release error');
      mockClient.release.mockImplementation(() => {
        throw releaseError;
      });

      await expect(initializeDatabase()).rejects.toThrow('Release error');
    });

    it('should execute queries in correct order', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      const calls = mockClient.query.mock.calls;
      const queries = calls.map((call: any) => call[0].trim());

      // Verify order: users, rooms, messages, index
      expect(queries[0]).toContain('CREATE TABLE IF NOT EXISTS users');
      expect(queries[1]).toContain('CREATE TABLE IF NOT EXISTS rooms');
      expect(queries[2]).toContain('CREATE TABLE IF NOT EXISTS messages');
      expect(queries[3]).toContain(
        'CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at'
      );
    });

    it('should handle multiple initialization calls', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      // Call initializeDatabase twice
      await initializeDatabase();
      await initializeDatabase();

      // Should execute all queries twice
      expect(mockClient.query).toHaveBeenCalledTimes(8); // 4 queries × 2 calls
      expect(mockClient.release).toHaveBeenCalledTimes(2);
    });

    it('should use correct table schema for users table', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      const usersTableQuery = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS users')
      )[0];

      expect(usersTableQuery).toContain('id VARCHAR(255) PRIMARY KEY');
      expect(usersTableQuery).toContain('name VARCHAR(255) NOT NULL');
      expect(usersTableQuery).toContain('avatar_url TEXT');
      expect(usersTableQuery).toContain('is_bot BOOLEAN DEFAULT FALSE');
    });

    it('should use correct table schema for rooms table', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      const roomsTableQuery = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS rooms')
      )[0];

      expect(roomsTableQuery).toContain('id VARCHAR(255) PRIMARY KEY');
      expect(roomsTableQuery).toContain('name VARCHAR(255) NOT NULL');
    });

    it('should use correct table schema for messages table', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      const messagesTableQuery = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes('CREATE TABLE IF NOT EXISTS messages')
      )[0];

      expect(messagesTableQuery).toContain('id VARCHAR(255) PRIMARY KEY');
      expect(messagesTableQuery).toContain('type VARCHAR(50) NOT NULL');
      expect(messagesTableQuery).toContain('content TEXT');
      expect(messagesTableQuery).toContain('kind VARCHAR(50)');
      expect(messagesTableQuery).toContain(
        'user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL'
      );
      expect(messagesTableQuery).toContain(
        'room_id VARCHAR(255) REFERENCES rooms(id) ON DELETE CASCADE'
      );
      expect(messagesTableQuery).toContain(
        'created_at TIMESTAMP WITH TIME ZONE NOT NULL'
      );
      expect(messagesTableQuery).toContain(
        'is_sent_to_bot BOOLEAN DEFAULT FALSE'
      );
    });

    it('should create correct index on messages table', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      await initializeDatabase();

      const indexQuery = mockClient.query.mock.calls.find((call: any) =>
        call[0].includes(
          'CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at'
        )
      )[0];

      expect(indexQuery).toContain(
        'CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at'
      );
      expect(indexQuery).toContain('ON messages(room_id, created_at DESC)');
    });
  });
});
