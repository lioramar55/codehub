export const BOT_CONSTANTS = {
  NG_GURU: { id: 'ng-guro', name: 'Ng Guro', isBot: true },
  RATE_LIMIT: {
    MAX_MESSAGES_PER_MINUTE: 5,
    WINDOW_MS: 60_000,
  },
} as const;

export const ERROR_MESSAGES = {
  BOT_RATE_LIMIT:
    'NG Guru limit reached. Please wait a minute and try again (limit is 5 messages per minute).',
  BOT_ERROR: 'NG Guru is experiencing difficulties, please try again later.',
  ROOM_NOT_FOUND: 'Room not found.',
} as const;
