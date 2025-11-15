import { DB } from '../db/db';
import { sendJSONToAll } from '../utils/helpers';
import { Room, RoomUser } from '../db/db';
import { MESSAGES } from '../utils/constants';

export function handleCreateRoom(ws: any) {
  const playerName = DB.sessions.get(ws);

  if (!playerName) {
    ws.send(
      JSON.stringify({
        type: 'create_room',
        data: MESSAGES.USER_NOT_LOGGEDIN,
        id: 0,
      }),R
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

  // const response = JSON.stringify({
  //     type: "create_room",
  //     data: "",
  //     id: 0,
  // });
  // ws.send(response);

  handleUpdateRoom();
}

export function handleUpdateRoom() {
  const roomsInfo = [...DB.rooms.values()]
    .filter((room) => room.users.length >= 0)
    .map((room) => ({
      roomId: room.roomId,
      roomUsers: room.users.map((u: any) => ({
        name: u.name,
        index: u.index,
      })),
    }));

  sendJSONToAll({
    type: 'update_room',
    data: JSON.stringify(roomsInfo),
    id: 0,
  });
}

export function handleAddUserToRoom(ws: any, data: any) {
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

  if (typeof data === 'string') {
    data = JSON.parse(data);
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

  const playerIndex = `player_${++DB.lastIndexId}`;

  const newUser: RoomUser = {
    ws,
    name: playerName,
    index: playerIndex,
  };

  room.users.push(newUser);

  const idGame = `game_${++DB.lastGameId}`;

  DB.games.set(idGame, {
    idGame,
    roomId,
    players: room.users,
    ships: {},
    turns: [],
    currentPlayer: room.users[0].index,
  });

  for (const user of room.users) {
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

  handleUpdateRoom();
}
