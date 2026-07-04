import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { userProfiles } from '../../../themes/copy';

interface Duel {
  id: string;
  challenger_id: string;
  defender_id: string;
  status: string;
}

interface DuelResult {
  challengerWins: boolean;
  chPower: number;
  defPower: number;
  winner_id: string;
  challenger_stake: Record<string, number>;
  defender_stake: Record<string, number>;
}

const RESOURCE_ICONS: Record<string, string> = {
  gold: '🪙', materials: '⛏️', food: '🌾', faction_currency: '⭐',
};

export function DuelArena({ onUpdate }: { onUpdate: () => void }) {
  const { user, token } = useAuthStore();
  const { triggerFlash, triggerShake, burst } = useCinematicStore();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [opponent, setOpponent] = useState('edward');
  const [result, setResult] = useState<DuelResult | null>(null);

  const fetchDuels = async () => {
    const data = await api<Duel[]>('/game/duels', {}, token);
    setDuels(data);
  };

  useEffect(() => { fetchDuels(); }, [token]);

  const challenge = async () => {
    await api('/game/duels/challenge', {
      method: 'POST',
      body: JSON.stringify({ opponent }),
    }, token);
    fetchDuels();
  };

  const accept = async (id: string) => {
    const res = await api<DuelResult>(`/game/duels/${id}/accept`, { method: 'POST' }, token);
    setResult(res);
    if (res.winner_id === user!.username) {
      triggerFlash('legendary');
      burst(50, 50, 20);
      playSound(user!.theme, 'legendary');
    } else {
      triggerFlash('damage');
      triggerShake('heavy');
    }
    fetchDuels();
    onUpdate();
  };

  const others = ['aden', 'edward', 'jamie'].filter((u) => u !== user!.username);

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 space-y-3">
        <h3 className="text-sm font-bold">1v1 Resource Duel</h3>
        <p className="text-xs opacity-50">
          Risk: LOW — you may lose 1-3 random resource types (2-8% each). Winner takes 80% of combined pot.
        </p>
        <select value={opponent} onChange={(e) => setOpponent(e.target.value)} className="w-full p-2 bg-transparent border border-current rounded text-sm">
          {others.map((u) => <option key={u} value={u}>{userProfiles[u]?.emoji} {u}</option>)}
        </select>
        <button onClick={challenge} className="theme-btn theme-btn-primary w-full text-sm">Challenge to Duel</button>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">Pending Challenges</h3>
        {duels.length === 0 && <p className="text-xs opacity-50">No pending duels</p>}
        {duels.map((d) => (
          <div key={d.id} className="theme-card p-4 flex items-center justify-between">
            <span className="text-sm">{d.challenger_id} vs {d.defender_id}</span>
            {d.defender_id === user!.username && (
              <button onClick={() => accept(d.id)} className="theme-btn theme-btn-primary text-xs px-3 py-1">
                ACCEPT DUEL
              </button>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="theme-card p-4 space-y-3 text-center"
          >
            <h3 className="text-lg font-bold glow-text">
              {result.winner_id === user!.username ? 'VICTORY!' : 'DEFEAT'}
            </h3>
            <p className="text-xs">Power: {result.chPower} vs {result.defPower}</p>
            <div className="text-xs space-y-1">
              <p>Stakes revealed:</p>
              <p>Challenger lost: {Object.entries(result.challenger_stake).map(([k, v]) => `${v}${RESOURCE_ICONS[k]}`).join(' ')}</p>
              <p>Defender lost: {Object.entries(result.defender_stake).map(([k, v]) => `${v}${RESOURCE_ICONS[k]}`).join(' ')}</p>
            </div>
            <button onClick={() => setResult(null)} className="theme-btn w-full text-xs">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
