import { WebSocket } from 'ws';
import { DB } from '../db/db';
import { sendUpdateWinners } from './winnersHandler';
import { handleUpdateRoom } from './roomHandler';
import { MESSAGES } from '../utils/constants';

export function handleReg(ws: WebSocket, dataString: string) {
  const data = JSON.parse(dataString);

  const { name, password } = data;

  let error = false;

  if (!DB.players.has(name)) {
    DB.players.set(name, {
      name,
      password,
      wins: 0,
    });
  }

  const player = DB.players.get(name)!;

  if (player.password !== password) {
    error = true;
  } else {
    DB.sessions.set(ws, name);
  }

  const response = JSON.stringify({
    type: 'reg',
    data: JSON.stringify({
      name,
      index: 1,
      error,
      errorText: error ? MESSAGES.WRONG_PASSWORD : '',
    }),
    id: 0,
  });

  ws.send(response);

  handleUpdateRoom();
  sendUpdateWinners();
}
