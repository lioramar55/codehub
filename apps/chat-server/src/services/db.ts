import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
});

export async function closePool() {
  await pool.end();
}

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        is_bot BOOLEAN DEFAULT FALSE
      )
    `);

    // Rooms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);

    // Messages table
    await client.query(`
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

    // Index for efficient room-based queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at 
      ON messages(room_id, created_at DESC)
    `);

    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}
