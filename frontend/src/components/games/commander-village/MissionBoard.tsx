import { useEffect } from 'react';
import type { GameState } from './CommanderVillage';

interface MissionBoardProps {
  state: GameState;
  onUpdate?: () => void;
}

export function MissionBoard({ state, onUpdate }: MissionBoardProps) {
  useEffect(() => {
    const id = setInterval(() => onUpdate?.(), 15000);
    return () => clearInterval(id);
  }, [onUpdate]);
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider">Mission Board</h3>
      {state.config.missions.map((m) => {
        const progress = state.missions.find((ms) => ms.mission_key === m.key);
        const pct = progress ? Math.min(100, (progress.progress / m.target) * 100) : 0;
        const done = progress?.status === 'completed';

        return (
          <div key={m.key} className={`theme-card p-4 ${done ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-sm">{m.name}</div>
                <div className="text-xs opacity-60">
                  Reward: {m.reward.gold}🪙 {m.reward.materials}⛏️
                </div>
              </div>
              {done && <span className="text-xs text-green-400 mission-stamp">COMPLETE</span>}
            </div>
            <div className="boss-health-bar">
              <div className="boss-health-fill" style={{ width: `${pct}%`, background: 'var(--success)' }} />
            </div>
            <div className="text-xs opacity-60 mt-1">
              {progress?.progress || 0} / {m.target}
            </div>
          </div>
        );
      })}
    </div>
  );
}
