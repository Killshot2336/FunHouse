import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useNotificationStore } from '../stores';
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
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [state, setState] = useState<RivalState | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const data = await api<RivalState>('/rival/state', {}, token);
      setState(data);
    } catch { /* retry on poll */ }
  }, [token]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 30000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const resetBattle = async () => {
    if (!confirm('Reset this week\'s faction war? HP and battle log start fresh.')) return;
    setResetting(true);
    try {
      const data = await api<RivalState>('/rival/reset', { method: 'POST' }, token);
      setState(data);
      notify('Faction war reset — fight again!', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cannot reset', 'error');
    } finally {
      setResetting(false);
    }
  };

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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="theme-card p-6 border-2 border-red-500/40 card-glow battle-pulse"
    >
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="font-bold text-lg tracking-widest text-red-400 glow-text">FRIDAY FACTION WAR</h2>
          <p className="text-xs opacity-60">{rival?.name} — led by {rival?.commander}</p>
        </div>
        <motion.div
          className="text-4xl"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ⚔️
        </motion.div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-400">{rival?.name}</span>
            <span>{battle.rival_hp_current} / {battle.rival_hp_max}</span>
          </div>
          <div className="boss-health-bar">
            <motion.div
              className="boss-health-fill bg-red-600"
              animate={{ width: `${rivalPct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-400">Your Household</span>
            <span>{battle.household_hp_current} / {battle.household_hp_max}</span>
          </div>
          <div className="boss-health-bar">
            <motion.div
              className="boss-health-fill"
              animate={{ width: `${housePct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </div>
      </div>

      {won && <p className="text-center mt-4 font-bold text-green-400 animate-pulse">VICTORY — The rival retreats!</p>}
      {lost && <p className="text-center mt-4 font-bold text-red-400 animate-pulse">DEFEAT — Fight harder next Friday!</p>}

      {!won && !lost && (
        <p className="text-xs text-center mt-3 opacity-60">
          Complete chores to deal damage. Rival counter-attacks every 30 min while you&apos;re idle.
        </p>
      )}

      {(lost || won) && user?.username === 'aden' && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={resetBattle}
          disabled={resetting}
          className="theme-btn theme-btn-primary w-full mt-4 py-2 text-sm"
        >
          {resetting ? 'Resetting...' : '↩ Reset Battle — Start Over'}
        </motion.button>
      )}

      {logs && logs.length > 0 && (
        <div className="mt-4 max-h-28 overflow-y-auto space-y-1">
          <h3 className="text-xs uppercase tracking-wider opacity-50 mb-2">Battle Log</h3>
          {logs.slice(-6).map((log, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-xs ${log.actor === 'rival' ? 'text-red-400/80' : log.actor === 'household' ? 'text-green-400/80' : 'opacity-60'}`}
            >
              {log.actor === 'rival' && '💀 '}
              {log.actor === 'household' && '⚡ '}
              {log.message}
              {log.damage > 0 && <span className="opacity-50"> (-{log.damage})</span>}
            </motion.p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
