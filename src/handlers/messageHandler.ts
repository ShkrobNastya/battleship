import { WebSocket } from 'ws';
import { handleReg } from './playerHandler';
import { handleCreateRoom, handleAddUserToRoom } from './roomHandler';

export function handleRequests(ws: WebSocket, msg: any) {
  console.log('Received:', msg.type);

  switch (msg.type) {
    case 'reg':
      return handleReg(ws, msg.data);
    case 'create_room':
      return handleCreateRoom(ws);
    case 'add_user_to_room':
      return handleAddUserToRoom(ws, msg.data);
    // case 'add_ships':
    //   return handleAddShips(ws, msg);
    // case 'attack':
    //   return handleAttack(ws, msg);
    // case 'randomAttack':
    //   return handleRandomAttack(ws, msg);
    default:
      console.warn('Unknown command:', msg.type);
  }
}
