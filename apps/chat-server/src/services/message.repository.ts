import { pool } from './db';
import { ChatEvent } from '@codehub/shared-models';

export interface MessageRow {
  id: string;
  type: 'user' | 'bot' | 'system';
  content?: string;
  kind?: 'join' | 'leave' | 'info';
  user_id: string;
  room_id: string;
  created_at: string;
}

export async function saveMessage(message: ChatEvent): Promise<void> {
  await pool.query(
    `INSERT INTO messages (id, type, content, kind, user_id, room_id, created_at, is_sent_to_bot)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      message.id,
      message.type,
      message.content || null,
      message.kind || null,
      message.user?.id || null,
      message.roomId || null,
      message.createdAt,
      message.isSentToBot || false,
    ]
  );
}

export async function getRoomHistoryWithUser(
  roomId: string,
  limit = 500
): Promise<ChatEvent[]> {
  const res = await pool.query(
    `SELECT m.*, u.name as user_name, u.avatar_url as user_avatar_url, u.is_bot as user_is_bot, m.is_sent_to_bot
     FROM messages m
     LEFT JOIN users u ON m.user_id = u.id
     WHERE m.room_id = $1
     ORDER BY m.created_at DESC
     LIMIT $2`,
    [roomId, limit]
  );
  return res.rows
    .map((row) => ({
      id: row.id,
      type: row.type,
      content: row.content,
      kind: row.kind,
      user: row.user_id
        ? {
            id: row.user_id,
            name: row.user_name,
            avatarUrl: row.user_avatar_url,
            isBot: row.user_is_bot,
          }
        : undefined,
      roomId: row.room_id,
      createdAt: row.created_at,
      isSentToBot: row.is_sent_to_bot,
    }))
    .reverse();
}
