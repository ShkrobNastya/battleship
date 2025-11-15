import { WebSocket } from 'ws';

export interface Player {
  name: string;
  password: string;
  wins: number;
}

export interface RoomUser {
  ws: WebSocket;
  name: string;
  index: string | number;
}

export interface Room {
  roomId: string;
  users: RoomUser[];
}

export const DB = {
  players: new Map<string, Player>(),
  sessions: new Map<WebSocket, string>(),
  rooms: new Map<string, any>(),
  games: new Map<string, any>(),
  lastRoomId: 0,
  lastIndexId: 0,
  lastGameId: 0,
};
