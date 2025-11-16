import { Ship, Game } from './../db/db';
import { WebSocket } from 'ws';
import { DB, RoomUser } from '../db/db';
import { sendMessageToUsers } from '../utils/helpers';
import { finishGame } from './gameHandler';

export function handleAttack(ws: WebSocket, dataString: string) {
  const data = JSON.parse(dataString);

  const { gameId, x, y, indexPlayer } = data;

  const game = DB.games.get(gameId);
  if (!game) return;

  if (game.currentPlayer !== indexPlayer) {
    return;
  }

  const enemy = game.players.find(
    (roomUser: RoomUser) => roomUser.index !== indexPlayer,
  );
  if (!enemy) {
    console.error('Enemy not found');
    return;
  }
  const enemyShips = game.ships[enemy.index];

  if (!game.hits) game.hits = {};
  if (!game.hits[indexPlayer]) game.hits[indexPlayer] = {};

  const posKey = `${x}_${y}`;
  if (game.hits[indexPlayer][posKey]) {
    return;
  }

  const ship = findShipAt(enemyShips, x, y);

  if (!ship) {
    game.hits[indexPlayer][posKey] = 'miss';

    sendAttackToAll(game, x, y, indexPlayer, 'miss');

    game.currentPlayer = enemy.index;

    sendMessageToUsers(
      game,
      'turn',
      JSON.stringify({
        currentPlayer: game.currentPlayer,
      }),
    );

    return;
  }

  if (!ship.hits) ship.hits = [];
  ship.hits.push({ x, y });

  game.hits[indexPlayer][posKey] = 'shot';

  const isKilled = isShipKilled(ship);

  if (!isKilled) {
    sendAttackToAll(game, x, y, indexPlayer, 'shot');

    sendMessageToUsers(
      game,
      'turn',
      JSON.stringify({
        currentPlayer: game.currentPlayer,
      }),
    );
    return;
  }

  sendAttackToAll(game, x, y, indexPlayer, 'killed');

  const contour = generateContour(ship);
  for (const c of contour) {
    const k = `${c.x}_${c.y}`;
    if (!game.hits[indexPlayer][k]) {
      game.hits[indexPlayer][k] = 'miss';
      sendAttackToAll(game, c.x, c.y, indexPlayer, 'miss');
    }
  }

  const allKilled = enemyShips.every(isShipKilled);
  if (allKilled) {
    finishGame(game, indexPlayer);
    return;
  }

  sendMessageToUsers(
    game,
    'turn',
    JSON.stringify({
      currentPlayer: game.currentPlayer,
    }),
  );
}

function findShipAt(ships: Ship[], x: number, y: number) {
  for (const s of ships) {
    const { position, direction, length } = s;

    for (let i = 0; i < length; i++) {
      const sx = direction ? position.x : position.x + i;
      const sy = direction ? position.y + i : position.y;

      if (sx === x && sy === y) return s;
    }
  }
  return null;
}

function isShipKilled(ship: Ship) {
  return ship.hits && ship.hits.length === ship.length;
}

function generateContour(ship: Ship) {
  const out: { x: number; y: number }[] = [];

  const { position, direction, length } = ship;

  const cells: { x: number; y: number }[] = [];

  for (let i = 0; i < length; i++) {
    const x = direction ? position.x : position.x + i;
    const y = direction ? position.y + i : position.y;
    cells.push({ x, y });
  }

  const dirs = [-1, 0, 1];

  for (const c of cells) {
    for (const dx of dirs) {
      for (const dy of dirs) {
        const nx = c.x + dx;
        const ny = c.y + dy;

        if (nx === c.x && ny === c.y) continue;

        out.push({ x: nx, y: ny });
      }
    }
  }

  return out.filter(
    (v, i, arr) => arr.findIndex((c) => c.x === v.x && c.y === v.y) === i,
  );
}

function sendAttackToAll(
  game: Game,
  x: number,
  y: number,
  currentPlayer: string,
  status: string,
) {
  sendMessageToUsers(
    game,
    'attack',
    JSON.stringify({
      position: { x, y },
      currentPlayer,
      status,
    }),
  );
}
