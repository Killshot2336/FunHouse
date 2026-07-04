import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';
import { useAuthStore } from '../../../stores';

interface Rank {
  user_id: string;
  power_rating: number;
  village_level: number;
  gold: number;
}

export function Leaderboard() {
  const { token } = useAuthStore();
  const [ranks, setRanks] = useState<Rank[]>([]);

  useEffect(() => {
    api<Rank[]>('/game/leaderboard', {}, token).then(setRanks);
  }, [token]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider">Household Rankings</h3>
      {ranks.map((r, i) => (
        <div key={r.user_id} className={`theme-card p-4 flex items-center gap-4 ${i === 0 ? 'border-2 border-yellow-500' : ''}`}>
          <div className="text-2xl font-bold opacity-40">#{i + 1}</div>
          <div className="text-2xl">{userProfiles[r.user_id]?.emoji}</div>
          <div className="flex-1">
            <div className="font-bold capitalize">{r.user_id}</div>
            <div className="text-xs opacity-60">Power: {r.power_rating} | Village Lv.{r.village_level}</div>
          </div>
          <div className="text-sm">🪙 {r.gold}</div>
        </div>
      ))}
    </div>
  );
}
