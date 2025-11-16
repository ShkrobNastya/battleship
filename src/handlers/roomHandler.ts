import { WebSocket } from 'ws';
import { DB } from '../db/db';
import { sendJSONToAll } from '../utils/helpers';
import { Room, RoomUser } from '../db/db';
import { MESSAGES } from '../utils/constants';

export function handleCreateRoom(ws: WebSocket) {
  const playerName = DB.sessions.get(ws);

  if (!playerName) {
    ws.send(
      JSON.stringify({
        type: 'create_room',
        data: MESSAGES.USER_NOT_LOGGEDIN,
        id: 0,
      }),
    );
    return;
  }

  const existingRoom = [...DB.rooms.values()].find(
    (room) => room.users.length > 0 && room.users[0].name === playerName,
  );

  if (existingRoom) {
    ws.send(
      JSON.stringify({
        type: 'create_room',
        data: MESSAGES.ROOM_IS_ALREADY_EXIST,
        id: 0,
      }),
    );
    return;
  }

  const roomId = `room_${++DB.lastRoomId}`;
  const index = `player_${++DB.lastIndexId}`;

  const roomUser: RoomUser = {
    ws,
    name: playerName,
    index,
  };

  const newRoom: Room = {
    roomId,
    users: [roomUser],
  };

  DB.rooms.set(roomId, newRoom);

  handleUpdateRoom();
}

export function handleUpdateRoom() {
  const roomsInfo = [...DB.rooms.values()]
    .filter((room) => room.users.length >= 0)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: room.users.map((roomUser: RoomUser) => ({
        name: roomUser.name,
        index: roomUser.index,
      })),
    }));

  sendJSONToAll('update_room', JSON.stringify(roomsInfo));
}

export function handleAddUserToRoom(ws: WebSocket, dataString: string) {
  const data = JSON.parse(dataString);

  const playerName = DB.sessions.get(ws);
  if (!playerName) {
    ws.send(
      JSON.stringify({
        type: 'add_user_to_room',
        data: MESSAGES.USER_NOT_LOGGEDIN,
        id: 0,
      }),
    );
    return;
  }

  const roomId = data.indexRoom;

  const room = DB.rooms.get(roomId);

  if (!room) {
    ws.send(
      JSON.stringify({
        type: 'add_user_to_room',
        data: MESSAGES.ROOM_NOT_FOUND,
        id: 0,
      }),
    );
    return;
  }

  if (room.users.length >= 2) {
    ws.send(
      JSON.stringify({
        type: 'add_user_to_room',
        data: MESSAGES.ROOM_IS_FULL,
        id: 0,
      }),
    );
    return;
  }

  if (room.users.some((roomUser: RoomUser) => roomUser.name === playerName)) {
    ws.send(
      JSON.stringify({
        type: 'add_user_to_room',
        data: MESSAGES.USER_ALREADY_IN_ROOM,
        id: 0,
      }),
    );
    return;
  }

  const playerIndex = `player_${++DB.lastIndexId}`;

  const newUser: RoomUser = {
    ws,
    name: playerName,
    index: playerIndex,
  };

  room.users.push(newUser);

  if (room.users.length === 2) {
    DB.rooms.delete(roomId);
  }

  if (room.users.length === 2) {
    const idGame = `game_${++DB.lastGameId}`;

    DB.games.set(idGame, {
      idGame,
      players: room.users,
      ships: {},
      currentPlayer: room.users[0].index,
    });

    for (const user of room.users) {
      if (user.ws) {
        user.ws.send(
          JSON.stringify({
            type: 'create_game',
            data: JSON.stringify({
              idGame,
              idPlayer: user.index,
            }),
            id: 0,
          }),
        );
      }
    }
  }

  handleUpdateRoom();
}
