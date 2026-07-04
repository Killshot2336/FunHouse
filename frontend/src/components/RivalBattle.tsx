import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../stores';
import { api } from '../lib/api';

interface RivalLog {
  message: string;
  actor: string;
  damage: number;
}

interface RivalState {
  active: boolean;
  nextFriday?: number;
  battle?: {
    rival_name: string;
    rival_commander: string;
    rival_hp_max: number;
    rival_hp_current: number;
    household_hp_max: number;
    household_hp_current: number;
    outcome: string;
  };
  rival?: { name: string; commander: string; vibe: string };
  logs?: RivalLog[];
}

export function RivalBattle() {
  const { token } = useAuthStore();
  const [state, setState] = useState<RivalState | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const data = await api<RivalState>('/rival/state', {}, token);
      setState(data);
    } catch { /* retry on poll */ }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 8000);
    return () => clearInterval(interval);
  }, [fetchState]);

  if (!state?.active || !state.battle) {
    if (state && !state.active) {
      return (
        <div className="theme-card p-4 opacity-60">
          <p className="text-sm text-center">
            Faction War unlocks every Friday. {state.nextFriday !== undefined && state.nextFriday > 0
              ? `${state.nextFriday} day${state.nextFriday === 1 ? '' : 's'} until the next battle.`
              : 'Prepare your army in Commander Village.'}
          </p>
        </div>
      );
    }
    return null;
  }

  const { battle, rival, logs } = state;
  const rivalPct = Math.max(0, (battle.rival_hp_current / battle.rival_hp_max) * 100);
  const housePct = Math.max(0, (battle.household_hp_current / battle.household_hp_max) * 100);
  const won = battle.outcome === 'household_win';
  const lost = battle.outcome === 'rival_win';

  return (
    <div className="theme-card p-6 border-2 border-red-500/30">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-bold text-lg tracking-wider text-red-400">FRIDAY FACTION WAR</h2>
          <p className="text-xs opacity-60">{rival?.name} — led by {rival?.commander}</p>
        </div>
        <div className="text-4xl">⚔️</div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">{rival?.name}</span>
            <span>{battle.rival_hp_current} / {battle.rival_hp_max}</span>
          </div>
          <div className="boss-health-bar">
            <div className="boss-health-fill bg-red-600" style={{ width: `${rivalPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-400">Your Household</span>
            <span>{battle.household_hp_current} / {battle.household_hp_max}</span>
          </div>
          <div className="boss-health-bar">
            <div className="boss-health-fill" style={{ width: `${housePct}%` }} />
          </div>
        </div>
      </div>

      {won && <p className="text-center mt-4 font-bold text-green-400 animate-pulse">VICTORY — The rival retreats!</p>}
      {lost && <p className="text-center mt-4 font-bold text-red-400 animate-pulse">DEFEAT — Fight harder next Friday!</p>}

      {!won && !lost && (
        <p className="text-xs text-center mt-3 opacity-60">
          Complete chores and grow your army to deal damage. The rival fights back while you&apos;re idle.
        </p>
      )}

      {logs && logs.length > 0 && (
        <div className="mt-4 max-h-32 overflow-y-auto space-y-1">
          <h3 className="text-xs uppercase tracking-wider opacity-50 mb-2">Battle Log</h3>
          {logs.slice(-8).map((log, i) => (
            <p key={i} className={`text-xs ${log.actor === 'rival' ? 'text-red-400/80' : log.actor === 'household' ? 'text-green-400/80' : 'opacity-60'}`}>
              {log.actor === 'rival' && '💀 '}
              {log.actor === 'household' && '⚡ '}
              {log.message}
              {log.damage > 0 && <span className="opacity-50"> (-{log.damage})</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
