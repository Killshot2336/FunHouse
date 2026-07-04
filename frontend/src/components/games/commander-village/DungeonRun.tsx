import { useEffect, useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { useCountdown, nextDungeonResetIso } from './useCountdown';
import type { GameState } from './CommanderVillage';

interface DungeonState {
  seed: number;
  resets_at: string;
  rooms_preview: Array<{ index: number; name: string; icon: string }>;
  room_count: number;
  run: {
    id: string;
    room_index: number;
    status: string;
    loot_json: unknown[];
  } | null;
}

interface DungeonRunProps {
  state: GameState;
  onUpdate: () => void;
}

export function DungeonRun({ state, onUpdate }: DungeonRunProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const { triggerFlash } = useCinematicStore();
  const [dungeon, setDungeon] = useState<DungeonState | null>(null);
  const [claiming, setClaiming] = useState(false);

  const fetchDungeon = () => {
    api<DungeonState>('/game/dungeon', {}, token).then(setDungeon).catch(() => {});
  };

  useEffect(() => { fetchDungeon(); }, [token, state]);

  const resetTarget = dungeon?.resets_at || nextDungeonResetIso();
  const { label: countdownLabel } = useCountdown(resetTarget);

  const enter = async () => {
    try {
      await api('/game/dungeon/enter', { method: 'POST' }, token);
      playSound(user!.theme, 'buildPlace');
      notify('Entered the dungeon!', 'success');
      fetchDungeon();
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Enter failed', 'error');
    }
  };

  const claim = async () => {
    setClaiming(true);
    try {
      const res = await api<{ completed: boolean; loot?: { name?: string } }>('/game/dungeon/claim', { method: 'POST' }, token);
      triggerFlash(res.completed ? 'legendary' : 'success');
      playSound(user!.theme, 'missionComplete');
      notify(
        res.completed ? 'Dungeon cleared!' : `Loot: ${res.loot?.name || 'item'} claimed`,
        'success'
      );
      fetchDungeon();
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Claim failed', 'error');
    }
    setClaiming(false);
  };

  if (!dungeon) return <div className="text-center p-4 opacity-60 text-sm">Loading dungeon...</div>;

  const run = dungeon.run;
  const progress = run ? (run.room_index / dungeon.room_count) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="theme-card p-4">
        <h3 className="text-sm font-bold">30-Minute Dungeon</h3>
        <p className="text-xs opacity-60">Resets in {countdownLabel} · Seed #{dungeon.seed}</p>
        <div className="mt-2 h-2 bg-black/30 rounded overflow-hidden">
          <div className="h-full bg-current transition-all" style={{ width: `${progress}%`, opacity: 0.6 }} />
        </div>
        {run && (
          <p className="text-xs mt-1 opacity-50">
            Room {run.room_index + 1}/{dungeon.room_count} · Power: {state.commander.power_rating}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {dungeon.rooms_preview.map((room) => (
          <div
            key={room.index}
            className={`theme-card p-3 text-center ${
              run && room.index < run.room_index ? 'opacity-40' :
              run && room.index === run.room_index ? 'border-2 border-current' : ''
            }`}
          >
            <div className="text-2xl">{room.icon}</div>
            <div className="text-xs font-bold">{room.name}</div>
            {run && room.index < run.room_index && <div className="text-[10px] text-green-400">✓ Cleared</div>}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {!run && (
          <button onClick={enter} className="theme-btn theme-btn-primary flex-1 py-2 text-sm">
            Enter Dungeon
          </button>
        )}
        {run && run.status === 'active' && (
          <button onClick={claim} disabled={claiming} className="theme-btn theme-btn-primary flex-1 py-2 text-sm">
            {claiming ? 'Claiming...' : 'Clear Room & Claim Loot'}
          </button>
        )}
        {run?.status === 'completed' && (
          <div className="theme-card p-3 flex-1 text-center text-sm text-green-400">
            Dungeon Complete! {(run.loot_json?.length || 0)} items looted.
          </div>
        )}
      </div>
    </div>
  );
}
