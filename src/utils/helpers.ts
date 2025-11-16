import { WebSocket } from 'ws';
import { DB, Game } from '../db/db';

export function sendJSON(ws: WebSocket, message: string) {
  ws.send(message);
}

export function sendJSONToAll(type: string, data: string) {
  for (const ws of DB.sessions.keys()) {
    ws.send(
      JSON.stringify({
        type,
        data,
        id: 0,
      }),
    );
  }
}

export function sendMessageToUsers(game: Game, type: string, data: string) {
  for (const player of game.players) {
    player.ws.send(
      JSON.stringify({
        type,
        data,
        id: 0,
      }),
    );
  }
}
