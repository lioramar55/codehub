import { pool } from './db';

export interface Room {
  id: string;
  name: string;
}

export async function createRoom(room: Room): Promise<void> {
  await pool.query(
    `INSERT INTO rooms (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET name = $2`,
    [room.id, room.name]
  );
}

export async function getRoomById(id: string): Promise<Room | null> {
  const res = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  return res.rows[0];
}

export async function getAllRooms(): Promise<Room[]> {
  const res = await pool.query('SELECT * FROM rooms ORDER BY name');
  return res.rows;
}
