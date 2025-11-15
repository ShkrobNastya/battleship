import { DB } from '../db/db';
import { sendUpdateWinners } from './winnersHandler';
import { handleUpdateRoom } from './roomHandler';
import { MESSAGES } from '../utils/constants';

export function handleReg(ws: any, data: any) {
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  const { name, password } = data;

  let error = false;
  let errorText = '';

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
    errorText = MESSAGES.WRONG_PASSWORD;
  } else {
    DB.sessions.set(ws, name);
  }

  const data1 = JSON.stringify({
    name,
    index: 1,
    error,
    errorText: error ? MESSAGES.WRONG_PASSWORD : '',
  });

  const response = JSON.stringify({
    type: 'reg',
    data: data1,
    id: 0,
  });

  ws.send(response);

  handleUpdateRoom();
  sendUpdateWinners();
}
