import { useState, useEffect } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound, getRarityClass } from '../../../lib/api';
import { RARITY_COLORS } from './gameConfig';
import type { GameState } from './CommanderVillage';

interface PatrolRaidProps {
  state: GameState;
  onUpdate: () => void;
}

export function PatrolRaid({ state, onUpdate }: PatrolRaidProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [drops, setDrops] = useState<Array<{ name: string; rarity: string }> | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const activePatrol = state.patrols.find((p) => !p.result_json);

  useEffect(() => {
    if (!activePatrol) return;
    const tick = () => {
      const left = Math.max(0, new Date(activePatrol.completes_at).getTime() - Date.now());
      setTimeLeft(Math.ceil(left / 1000));
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [activePatrol]);

  const startPatrol = async () => {
    try {
      await api('/game/patrol', { method: 'POST' }, token);
      playSound(user!.theme, 'buildPlace');
      notify('Patrol launched — 30 seconds!', 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Patrol failed', 'error');
    }
  };

  const claimPatrol = async () => {
    if (!activePatrol) return;
    try {
      const res = await api<{ drops: Array<{ name: string; rarity: string }> }>(
        `/game/patrol/${activePatrol.id}/claim`, { method: 'POST' }, token
      );
      setDrops(res.drops);
      const hasLegendary = res.drops.some((d) => d.rarity === 'legendary' || d.rarity === 'mythic');
      playSound(user!.theme, hasLegendary ? 'legendary' : 'craft');
      notify(`Patrol complete — ${res.drops.length} drop(s)!`, 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Claim failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="theme-card p-6 text-center">
        <div className="text-4xl mb-2">🎯</div>
        <h3 className="font-bold mb-2">Send Patrol for RNG Loot</h3>
        <p className="text-xs opacity-60 mb-4">
          Patrols take 30 seconds and return random gear. Rare drops have stat bonuses!
        </p>

        {!activePatrol ? (
          <button onClick={startPatrol} className="theme-btn theme-btn-primary px-6 py-3">
            Launch Patrol
          </button>
        ) : timeLeft > 0 ? (
          <div>
            <div className="text-2xl font-bold animate-pulse">{timeLeft}s</div>
            <div className="text-xs opacity-60">Patrol in progress...</div>
          </div>
        ) : (
          <button onClick={claimPatrol} className="theme-btn theme-btn-primary px-6 py-3 drop-reveal">
            Claim Loot!
          </button>
        )}
      </div>

      {drops && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold">Drops Acquired!</h3>
          {drops.map((d, i) => (
            <div
              key={i}
              className={`theme-card p-3 flex justify-between items-center ${getRarityClass(d.rarity)}`}
              style={{ borderColor: RARITY_COLORS[d.rarity as keyof typeof RARITY_COLORS] }}
            >
              <span className="font-bold">{d.name}</span>
              <span className="text-xs uppercase" style={{ color: RARITY_COLORS[d.rarity as keyof typeof RARITY_COLORS] }}>
                {d.rarity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
