import { WebSocket } from 'ws';
import { DB, Game, RoomUser } from '../db/db';
import { sendUpdateWinners } from './winnersHandler';
import { MESSAGES } from '../utils/constants';
import { sendMessageToUsers } from '../utils/helpers';

export function handleAddShips(ws: WebSocket, dataString: string) {
  const data = JSON.parse(dataString);

  const { gameId, ships, indexPlayer } = data;

  const game = DB.games.get(gameId);

  if (!game) {
    ws.send(
      JSON.stringify({
        type: 'add_ships',
        data: MESSAGES.GAME_NOT_FOUND,
        id: 0,
      }),
    );
    return;
  }

  game.ships[indexPlayer] = ships;

  const players = game.players.map((roomPlayer: RoomUser) => roomPlayer.index);

  const allReady = players.every((p: string | number) => game.ships[p]);

  if (!allReady) return;

  startGame(game);
}

export function startGame(game: Game) {
  const { players, ships } = game;

  for (const player of players) {
    const playerShips = ships[player.index];

    if (player.ws) {
      // проверяем, что ws не null
      player.ws.send(
        JSON.stringify({
          type: 'start_game',
          data: JSON.stringify({
            ships: playerShips,
            currentPlayerIndex: player.index,
          }),
          id: 0,
        }),
      );
    }
  }

  sendMessageToUsers(
    game,
    'turn',
    JSON.stringify({
      currentPlayer: game.currentPlayer,
    }),
  );
}

export function finishGame(game: Game, winnerIndex: string) {
  sendMessageToUsers(
    game,
    'finish',
    JSON.stringify({ winPlayer: winnerIndex }),
  );

  const winnerPlayer = game.players.find(
    (p: RoomUser) => p.index === winnerIndex,
  );
  if (winnerPlayer) {
    const storedPlayer = DB.players.get(winnerPlayer.name);
    if (storedPlayer) {
      storedPlayer.wins = (storedPlayer.wins || 0) + 1;
    }
  }

  sendUpdateWinners();

  DB.games.delete(game.idGame);
}
