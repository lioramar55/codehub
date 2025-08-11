# Socket.io Realtime Module

This module handles all real-time communication for the chat application using Socket.io. The code has been organized following industry best practices for maintainability and scalability.

## Architecture Overview

The socket implementation is split into several focused modules:

### Core Modules

- **`socket.ts`** - Main entry point that sets up Socket.io and initializes all managers
- **`constants.ts`** - Centralized constants for rooms, bots, and error messages
- **`types.ts`** - TypeScript interfaces and types for socket events and data

### Manager Classes

- **`RoomManager`** - Handles room operations, participant management, and room history
- **`MessageManager`** - Manages message creation, saving, and broadcasting
- **`BotHandler`** - Handles bot interactions, rate limiting, and programming question detection

### Event Handlers

- **`EventHandlers`** - Centralized event handling for all socket events

## File Structure

```
realtime/
├── socket.ts           # Main socket setup
├── constants.ts        # Shared constants
├── types.ts           # TypeScript interfaces
├── room-manager.ts    # Room and participant management
├── message-manager.ts # Message operations
├── bot-service.ts     # Bot integration and rate limiting
├── event-handlers.ts  # Socket event handlers
├── index.ts          # Module exports
└── README.md         # This documentation
```

## Key Features

### Separation of Concerns

- Each module has a single responsibility
- Clear interfaces between modules
- Easy to test individual components

### Error Handling

- Centralized error handling in each manager
- Graceful degradation for bot failures
- Proper logging for debugging

### Rate Limiting

- Built-in rate limiting for bot responses
- Configurable limits via constants
- Automatic cleanup of old timestamps

### Type Safety

- Full TypeScript support
- Strongly typed event payloads
- Interface-based design

## Usage

The main `setupSocket` function is called from the server entry point:

```typescript
import { setupSocket } from './realtime';

// In your main server file
setupSocket(io);
```

## Benefits of This Architecture

1. **Maintainability** - Each module is focused and easy to understand
2. **Testability** - Individual components can be unit tested
3. **Scalability** - Easy to add new features or modify existing ones
4. **Reusability** - Managers can be reused in different contexts
5. **Type Safety** - Full TypeScript support prevents runtime errors

## Adding New Features

To add new socket events or functionality:

1. Add new types to `types.ts`
2. Create handlers in `EventHandlers` class
3. Register the event in `socket.ts`
4. Add any new constants to `constants.ts`

This modular approach makes it easy to extend the functionality while maintaining code quality and organization.
