import { pool } from './db';
import { User } from '@codehub/shared-models';

export async function createUser(user: User): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, name, avatar_url, is_bot) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET name = $2, avatar_url = $3, is_bot = $4`,
    [user.id, user.name, user.avatarUrl || null, user.isBot || false]
  );
}

export async function getUserById(id: string): Promise<User | null> {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url,
    isBot: row.is_bot,
  };
}
