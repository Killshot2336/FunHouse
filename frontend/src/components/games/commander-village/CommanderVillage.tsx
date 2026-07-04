import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import { StoryIntro } from './StoryIntro';
import { VillageMap } from './VillageMap';
import { ArmyRoster } from './ArmyRoster';
import { PatrolRaid } from './PatrolRaid';
import { MissionBoard } from './MissionBoard';
import { TradeHub } from './TradeHub';
import { Leaderboard } from './Leaderboard';
import { InventoryGrid } from './InventoryGrid';

export interface GameState {
  commander: {
    user_id: string;
    patron: string;
    gold: number;
    materials: number;
    food: number;
    faction_currency: number;
    village_level: number;
    power_rating: number;
    story_seen: boolean;
    grid_size: number;
  };
  buildings: Array<{ id: string; building_key: string; grid_x: number; grid_y: number; level: number }>;
  units: Array<{
    id: string; unit_key: string; slot_index: number;
    stats: { atk: number; def: number; spd: number; luck: number };
    cosmetics: Record<string, string>;
    equipment: Record<string, string | null>;
  }>;
  inventory: Array<{
    id: string; item_id: string; name: string; rarity: string;
    stats: Record<string, number>; equipped_to_unit: string | null;
  }>;
  missions: Array<{ mission_key: string; status: string; progress: number }>;
  patrols: Array<{ id: string; completes_at: string; result_json: unknown }>;
  story: { title: string; text: string };
  config: {
    buildings: Record<string, unknown>;
    units: Array<{ key: string; name: string; icon: string; baseCost: number }>;
    missions: Array<{ key: string; name: string; type: string; target: number; reward: Record<string, number> }>;
  };
}

type Tab = 'village' | 'army' | 'patrol' | 'missions' | 'inventory' | 'trade' | 'leaderboard';

export function CommanderVillage() {
  const { user, token } = useAuthStore();
  const [state, setState] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>(user!.theme === 'warlock' ? 'village' : user!.theme === 'enclave' ? 'missions' : 'patrol');
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const data = await api<GameState>('/game/state', {}, token);
      setState(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchState(); }, [fetchState]);

  const refresh = () => fetchState();

  if (loading) return <div className="text-center p-8 opacity-60">Loading Commander Village...</div>;
  if (!state) return <div className="text-center p-8">Failed to load game.</div>;

  if (!state.commander.story_seen) {
    return (
      <StoryIntro
        story={state.story}
        patron={state.commander.patron}
        onComplete={async () => {
          await api('/game/story-seen', { method: 'POST' }, token);
          refresh();
        }}
      />
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'village', label: 'Village', icon: '🏘️' },
    { key: 'army', label: 'Army', icon: '⚔️' },
    { key: 'patrol', label: 'Patrol', icon: '🎯' },
    { key: 'missions', label: 'Missions', icon: '📋' },
    { key: 'inventory', label: 'Loot', icon: '🎒' },
    { key: 'trade', label: 'Trade', icon: '🤝' },
    { key: 'leaderboard', label: 'Ranks', icon: '🏆' },
  ];

  return (
    <div className="space-y-4">
      <div className="theme-card p-4 flex flex-wrap gap-3 justify-between items-center">
        <div>
          <div className="text-xs opacity-60">Commander {user!.displayName}</div>
          <div className="font-bold">Power: {state.commander.power_rating} | Village Lv.{state.commander.village_level}</div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span>🪙 {state.commander.gold}</span>
          <span>⛏️ {state.commander.materials}</span>
          <span>🌾 {state.commander.food}</span>
          <span>⭐ {state.commander.faction_currency}</span>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`theme-btn text-xs whitespace-nowrap px-3 py-2 ${tab === t.key ? 'theme-btn-primary' : ''}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'village' && <VillageMap state={state} onUpdate={refresh} />}
      {tab === 'army' && <ArmyRoster state={state} onUpdate={refresh} />}
      {tab === 'patrol' && <PatrolRaid state={state} onUpdate={refresh} />}
      {tab === 'missions' && <MissionBoard state={state} />}
      {tab === 'inventory' && <InventoryGrid state={state} onUpdate={refresh} />}
      {tab === 'trade' && <TradeHub onUpdate={refresh} />}
      {tab === 'leaderboard' && <Leaderboard />}
    </div>
  );
}
