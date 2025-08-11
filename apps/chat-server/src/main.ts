import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './realtime/socket';
import { closePool, initializeDatabase } from './services/db';
import path from 'path';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
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
  res.send({ message: 'Hello API' });
});

httpServer.listen(port, () => {
  console.log(`[ ready ] on port: ${port}`);
  initializeDatabase().catch((err) => {
    console.error('Database initialization error:', err);
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await closePool();
  process.exit(0);
});
