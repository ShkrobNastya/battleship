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

export interface Ship {
  position: { x: number; y: number };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
  hits?: { x: number; y: number }[];
}

export interface Game {
  idGame: string;
  players: RoomUser[];
  ships: Record<string, Ship[]>;
  hits?: Record<string, Record<string, 'miss' | 'shot'>>;
  currentPlayer: string | number;
}

export const DB = {
  players: new Map<string, Player>(),
  sessions: new Map<WebSocket, string>(),
  rooms: new Map<string, Room>(),
  games: new Map<string, Game>(),
  lastRoomId: 0,
  lastIndexId: 0,
  lastGameId: 0,
};
