import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { userProfiles } from '../../../themes/copy';
import { useAuthStore } from '../../../stores';
import { HoloCard } from '../../effects/HoloCard';

interface Rank {
  user_id: string;
  power_rating: number;
  village_level: number;
  gold: number;
}

export function Leaderboard() {
  const { token } = useAuthStore();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<Rank[]>('/game/leaderboard', {}, token)
      .then((data) => { setRanks(data); setError(''); })
      .catch(() => setError('Could not load rankings'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="text-center p-4 opacity-60 text-sm">Loading rankings...</div>;
  if (error) return <div className="theme-card p-4 text-center text-sm text-red-400">{error}</div>;
  if (!ranks.length) return <div className="theme-card p-4 text-center opacity-60 text-sm">No commanders ranked yet.</div>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider">Household Rankings</h3>
      {ranks.map((r, i) => (
        <HoloCard key={r.user_id} delay={i * 0.05} className={`p-4 flex items-center gap-4 ${i === 0 ? 'ring-2 ring-yellow-500/50' : ''}`}>
          <div className="text-2xl font-bold opacity-40">#{i + 1}</div>
          <div className="text-2xl">{userProfiles[r.user_id]?.emoji}</div>
          <div className="flex-1">
            <div className="font-bold capitalize">{r.user_id}</div>
            <div className="text-xs opacity-60">Power: {r.power_rating} | Village Lv.{r.village_level}</div>
          </div>
          <div className="text-sm">🪙 {r.gold}</div>
        </HoloCard>
      ))}
    </div>
  );
}
