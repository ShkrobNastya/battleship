import { WebSocket } from 'ws';
import { handleReg } from './playerHandler';
import { handleCreateRoom, handleAddUserToRoom } from './roomHandler';
import { handleAddShips } from './gameHandler';
import { handleAttack } from './attackHandler';

export function handleRequests(ws: WebSocket, msg: string) {
  const message = JSON.parse(msg);

  switch (message.type) {
    case 'reg':
      return handleReg(ws, message.data);
    case 'create_room':
      return handleCreateRoom(ws);
    case 'add_user_to_room':
      return handleAddUserToRoom(ws, message.data);
    case 'add_ships':
      return handleAddShips(ws, message.data);
    case 'attack':
      return handleAttack(ws, message.data);
    // case 'randomAttack':
    //   return handleRandomAttack(ws, msg);
    default:
      console.warn('Unknown command:', message.type);
  }
}
