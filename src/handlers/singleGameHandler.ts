import { DB, RoomUser, Ship } from '../db/db';
import { MESSAGES } from '../utils/constants';
import { WebSocket } from 'ws';

export function handleSinglePlay(ws: WebSocket) {
  const playerName = DB.sessions.get(ws);

  if (!playerName) {
    ws.send(
      JSON.stringify({
        type: 'single_play',
        data: MESSAGES.USER_NOT_LOGGEDIN,
        id: 0,
      }),
    );
    return;
  }

  const gameId = `game_${++DB.lastGameId}`;

  const humanIndex = `player_${++DB.lastIndexId}`;
  const botIndex = `player_${++DB.lastIndexId}`;

  const human: RoomUser = { ws, name: playerName, index: humanIndex };
  const bot: RoomUser = { ws: null, name: 'BOT', index: botIndex };

  DB.games.set(gameId, {
    idGame: gameId,
    players: [human, bot],
    ships: {},
    hits: {},
    currentPlayer: humanIndex,
    isSinglePlay: true,
  });

  ws.send(
    JSON.stringify({
      type: 'create_game',
      data: JSON.stringify({
        idGame: gameId,
        idPlayer: humanIndex,
      }),
      id: 0,
    }),
  );

  const botShips = generateBotShips();

  const game = DB.games.get(gameId)!;
  game.ships[botIndex] = botShips;
}

export function generateBotShips(): Ship[] {
  const ships: Ship[] = [];

  const types = [
    { type: 'huge', length: 4, count: 1 },
    { type: 'large', length: 3, count: 2 },
    { type: 'medium', length: 2, count: 3 },
    { type: 'small', length: 1, count: 4 },
  ] as const;

  const board = Array.from({ length: 10 }, () => Array(10).fill(0));

  for (const s of types) {
    for (let k = 0; k < s.count; k++) {
      let placed = false;

      while (!placed) {
        const direction = Math.random() < 0.5;
        const x = Math.floor(Math.random() * 10);
        const y = Math.floor(Math.random() * 10);

        if (canPlace(board, x, y, direction, s.length)) {
          place(board, x, y, direction, s.length);

          ships.push({
            position: { x, y },
            direction,
            length: s.length,
            type: s.type,
            hits: [],
          });

          placed = true;
        }
      }
    }
  }

  return ships;
}

function place(
  board: number[][],
  x: number,
  y: number,
  direction: boolean,
  length: number,
) {
  const dx = direction ? 0 : 1;
  const dy = direction ? 1 : 0;

  for (let i = 0; i < length; i++) {
    const cx = x + dx * i;
    const cy = y + dy * i;
    board[cy][cx] = 1;
  }
}

function canPlace(
  board: number[][],
  x: number,
  y: number,
  direction: boolean,
  length: number,
): boolean {
  const dx = direction ? 0 : 1;
  const dy = direction ? 1 : 0;

  const endX = x + dx * (length - 1);
  const endY = y + dy * (length - 1);

  if (endX < 0 || endX > 9 || endY < 0 || endY > 9) {
    return false;
  }

  for (let i = 0; i < length; i++) {
    const cx = x + dx * i;
    const cy = y + dy * i;

    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        const nx = cx + ix;
        const ny = cy + iy;

        if (nx >= 0 && nx <= 9 && ny >= 0 && ny <= 9) {
          if (board[ny][nx] !== 0) return false;
        }
      }
    }
  }

  return true;
}
