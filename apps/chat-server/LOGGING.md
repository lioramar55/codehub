# Winston Logging Setup

This document describes the comprehensive logging setup using Winston for the chat server application.

## Overview

The application uses Winston for structured logging with the following features:

- **Multiple log levels**: error, warn, info, http, debug
- **File rotation**: Daily log files with automatic cleanup
- **Environment-based configuration**: Different log levels for development vs production
- **Structured logging**: JSON format for better parsing
- **HTTP request logging**: Using Morgan middleware
- **Database query logging**: Automatic timing and error tracking
- **Socket.IO event logging**: Real-time event tracking
- **Exception handling**: Uncaught exceptions and unhandled rejections

## Log Files

Logs are stored in the `logs/` directory with the following structure:

- `error-YYYY-MM-DD.log`: Error-level logs only
- `combined-YYYY-MM-DD.log`: All log levels
- `exceptions-YYYY-MM-DD.log`: Uncaught exceptions
- `rejections-YYYY-MM-DD.log`: Unhandled promise rejections

### Log Rotation

- **Max file size**: 20MB per file
- **Retention**: 14 days
- **Compression**: Old log files are automatically compressed
- **Date pattern**: YYYY-MM-DD

## Configuration

### Environment Variables

- `NODE_ENV`: Controls log level (development = debug, production = warn)
- `PORT`: Server port (logged on startup)

### Log Levels

1. **error** (0): Application errors and exceptions
2. **warn** (1): Warning messages
3. **info** (2): General information
4. **http** (3): HTTP request logs
5. **debug** (4): Detailed debugging information

## Usage

### Basic Logging

```typescript
import logger, { logInfo, logError, logWarn, logDebug } from '../utils/logger';

// Simple logging
logInfo('User logged in', { userId: '123', timestamp: new Date() });
logError(new Error('Database connection failed'), 'Database');
logWarn('High memory usage detected', { memoryUsage: process.memoryUsage() });
logDebug('Processing request', { requestId: 'abc123' });
```

### HTTP Request Logging

HTTP requests are automatically logged using Morgan middleware. The format includes:

- HTTP method
- URL
- Status code
- Response time
- User agent
- IP address

### Database Query Logging

All database queries are automatically logged with:

- SQL query
- Parameters
- Execution time
- Error details (if any)

```typescript
// This is automatically logged by the DatabaseLogger wrapper
await db.query('SELECT * FROM users WHERE id = $1', ['123']);
```

### Socket.IO Event Logging

Socket events are automatically logged with:

- Event name
- Socket ID
- Event data
- Error details (if any)

```typescript
// This is automatically logged in socket.ts
socket.emit('message:send', { content: 'Hello', roomId: 'room1' });
```

## Production Debugging

### 1. Monitor Error Logs

```bash
# View recent errors
tail -f logs/error-$(date +%Y-%m-%d).log

# Search for specific errors
grep "Database Error" logs/error-*.log
```

### 2. Track Performance Issues

```bash
# Find slow database queries
grep "duration.*[0-9][0-9][0-9]ms" logs/combined-*.log

# Monitor HTTP response times
grep "HTTP.*[0-9][0-9][0-9]ms" logs/combined-*.log
```

### 3. Debug Socket Issues

```bash
# Track socket connections
grep "Socket Event: connection" logs/combined-*.log

# Monitor message events
grep "Socket Event: message:send" logs/combined-*.log
```

### 4. Memory and Resource Monitoring

```bash
# Check for memory warnings
grep "High memory usage" logs/combined-*.log

# Monitor database pool status
grep "Database connection pool" logs/combined-*.log
```

## Log Analysis Tools

### 1. Real-time Monitoring

```bash
# Watch all logs in real-time
tail -f logs/combined-$(date +%Y-%m-%d).log | jq '.'

# Filter by log level
tail -f logs/combined-$(date +%Y-%m-%d).log | jq 'select(.level == "error")'
```

### 2. Performance Analysis

```bash
# Extract query times
grep "Database Query" logs/combined-*.log | jq '.duration' | sort -n

# Find slowest queries
grep "Database Query" logs/combined-*.log | jq 'select(.duration | tonumber > 1000)'
```

### 3. Error Pattern Analysis

```bash
# Count error types
grep "error" logs/error-*.log | jq '.message' | sort | uniq -c

# Find most common errors
grep "error" logs/error-*.log | jq '.message' | sort | uniq -c | sort -nr
```

## Customization

### Adding Custom Log Levels

```typescript
// In utils/logger.ts
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  custom: 5, // Add custom level
};
```

### Custom Transports

```typescript
// Add external logging service
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    // ... existing transports
    new winston.transports.Http({
      host: 'your-logging-service.com',
      port: 80,
      path: '/logs',
    }),
  ],
});
```

### Environment-Specific Configuration

```typescript
// Different log levels per environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'development':
      return 'debug';
    case 'staging':
      return 'info';
    case 'production':
      return 'warn';
    default:
      return 'info';
  }
};
```

## Best Practices

1. **Use structured logging**: Always include relevant metadata
2. **Log at appropriate levels**: Don't log everything as info
3. **Include context**: Add request IDs, user IDs, etc.
4. **Monitor log volume**: Avoid excessive logging in production
5. **Regular cleanup**: Ensure log rotation is working
6. **Security**: Don't log sensitive information (passwords, tokens)
7. **Performance**: Use async logging for high-volume applications

## Troubleshooting

### Common Issues

1. **Log files not created**: Check directory permissions
2. **High disk usage**: Verify log rotation settings
3. **Missing logs**: Check log level configuration
4. **Performance impact**: Consider async logging for high volume

### Debug Commands

```bash
# Check log directory
ls -la logs/

# Verify log rotation
find logs/ -name "*.log" -mtime +14

# Check disk usage
du -sh logs/

# Monitor log file growth
watch -n 1 'ls -lh logs/'
```
