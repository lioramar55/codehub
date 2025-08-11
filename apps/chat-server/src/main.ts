import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { setupSocket } from './realtime/socket';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
setupSocket(io);

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

httpServer.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});
