import { DB, Player } from '../db/db';
import { sendJSONToAll } from '../utils/helpers';

export function sendUpdateWinners() {
  const winners = [...DB.players.values()]
    .map((player: Player) => ({
      name: player.name,
      wins: player.wins,
    }))
    .sort((a, b) => b.wins - a.wins);

  sendJSONToAll('update_winners', JSON.stringify(winners));
}
