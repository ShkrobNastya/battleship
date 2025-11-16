import { WebSocketServer, WebSocket } from 'ws';
import { httpServer } from './src/http_server/index';
import { handleRequests } from './src/handlers/messageHandler';
import { sendJSON } from './src/utils/helpers';

const wss = new WebSocketServer({ port: 3000 });
const HTTP_PORT = 8181;

wss.on('connection', function connection(ws: WebSocket) {
  console.log('New client connected');

  ws.on('error', handleSocketError);

  ws.on('message', (msg: string) => {
    try {
      handleRequests(ws, msg);
    } catch (e) {
      console.error('Invalid JSON from client', e);
      sendJSON(
        ws,
        JSON.stringify({
          type: 'error',
          data: { message: 'Invalid JSON' },
          id: 0,
        }),
      );
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

httpServer.on('upgrade', (req, socket) => {
  socket.on('error', handleSocketError);
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`Static HTTP server running on port ${HTTP_PORT}`);
});

function handleSocketError(err: unknown) {
  console.error(err);
}

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
