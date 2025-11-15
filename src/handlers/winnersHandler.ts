import { DB } from '../db/db';
import { sendJSONToAll } from '../utils/helpers';

export function sendUpdateWinners() {
  const winners = [...DB.players.values()]
    .map((p) => ({
      name: p.name,
      wins: p.wins,
    }))
    .sort((a, b) => b.wins - a.wins);

  sendJSONToAll({
    type: 'update_winners',
    data: JSON.stringify(winners),
    id: 0,
  });
}
