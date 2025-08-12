import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import morgan from 'morgan';
import { setupSocket } from './realtime/socket';
import { closePool, initializeDatabase } from './services/db';
import { stream, logInfo, logError, logWarn } from './utils/logger';
import path from 'path';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

// Add HTTP request logging middleware
app.use(morgan('combined', { stream }));

app.use(cors());
app.use(express.json());

if (process.env.environment === 'production') {
  const staticDir = path.resolve(
    process.cwd(),
    'dist/apps/chat-server/public/browser'
  );

  app.use(express.static(staticDir, { index: false }));

  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
setupSocket(io);

app.get('/', (req, res) => {
  logInfo('API root endpoint accessed', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  res.send({ message: 'Hello API' });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  const healthData = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
    botService: {
      configured: !!process.env.GEMINI_API_KEY,
      hasApiKey: !!process.env.GEMINI_API_KEY,
    },
    environment: process.env.NODE_ENV || 'development',
  };

  logInfo('Health check requested', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    connections: healthData.connections,
    botConfigured: healthData.botService.configured,
  });

  res.status(200).json(healthData);
});

httpServer.listen(port, () => {
  logInfo(`Server started successfully`, {
    port,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
  });

  // Check bot service configuration
  if (process.env.GEMINI_API_KEY) {
    logInfo('Bot service configured', {
      hasApiKey: true,
      apiKeyLength: process.env.GEMINI_API_KEY.length,
    });
  } else {
    logWarn('Bot service not configured - GEMINI_API_KEY missing', {
      hasApiKey: false,
    });
  }

  initializeDatabase().catch((err) => {
    logError(err, 'Database initialization');
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Received SIGINT signal, shutting down server gracefully...');
  await closePool();
  logInfo('Server shutdown completed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logInfo('Received SIGTERM signal, shutting down server gracefully...');
  await closePool();
  logInfo('Server shutdown completed');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(error, 'Uncaught Exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(
    new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`),
    'Unhandled Rejection'
  );
  process.exit(1);
});
