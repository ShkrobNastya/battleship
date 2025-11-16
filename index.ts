import { WebSocketServer, RawData } from 'ws';
import { httpServer } from "./src/http_server/index";
import { handleRequests } from "./src/handlers/messageHandler";
import {sendJSON} from "./src/utils/helpers";

function onSocketError(err: any) {
  console.error(err);
}
const wss = new WebSocketServer({ port: 3000 });
const HTTP_PORT = 8181;

wss.on('connection', function connection(ws: any, request:any, client:any) {
  console.log('New client connected');

  ws.on('error', console.error);


  ws.on('message', (msg:string) => {
    try {
      console.log(msg.toString());
      handleRequests(ws, msg);
    } catch (e) {
      console.error('Invalid JSON from client', e);
      sendJSON(ws, JSON.stringify({
        type: 'error',
        data: { message: 'Invalid JSON' },
        id: 0,
      }));
    }
  });

  ws.on('close', () => console.log('Client disconnected'));

});

process.on('SIGINT', () => {
  console.log('🛑 Server shutting down...');
  wss.close();
  process.exit(0);
});

httpServer.on('upgrade', function upgrade(request, socket, head) {
  socket.on('error', onSocketError);
});

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);
