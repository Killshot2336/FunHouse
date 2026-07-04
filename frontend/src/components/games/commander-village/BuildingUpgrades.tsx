import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import type { GameState } from './CommanderVillage';

interface BuildingUpgradesProps {
  state: GameState;
  building: GameState['buildings'][0];
  onUpdate: () => void;
}

export function BuildingUpgrades({ state, building, onUpdate }: BuildingUpgradesProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [upgrading, setUpgrading] = useState<number | null>(null);

  const meta = (building.building_meta_json || { upgrades: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } }) as {
    upgrades: Record<string, number>;
  };
  const tree = state.config.upgrade_trees?.[building.building_key] || [];

  const upgrade = async (slot: number) => {
    const slotDef = tree.find((s) => s.slot === slot);
    const prevLevel = meta.upgrades[String(slot)] || 0;
    setUpgrading(slot);
    try {
      await api(`/game/buildings/${building.id}/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ slot }),
      }, token);
      playSound(user!.theme, 'buildPlace');
      const newLevel = prevLevel + 1;
      notify(
        slotDef
          ? `${slotDef.name} → Lv.${newLevel} active! ${slotDef.desc}`
          : `Upgrade slot ${slot} → Lv.${newLevel}`,
        'success'
      );
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Upgrade failed', 'error');
    }
    setUpgrading(null);
  };

  if (!tree.length) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold opacity-60">Upgrade Slots</h4>
      {tree.map((slot) => {
        const level = meta.upgrades[String(slot.slot)] || 0;
        const cost = { gold: Math.floor((20 + slot.slot * 10) * Math.pow(1.2, level)), materials: Math.floor(5 * slot.slot * (level + 1)) };
        const canAfford = state.commander.gold >= cost.gold && state.commander.materials >= cost.materials;
        return (
          <div key={slot.slot} className="p-2 rounded border border-current/10 bg-black/20">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-bold">{slot.name} Lv.{level}</div>
                <div className="text-[10px] opacity-50">{slot.desc}</div>
              </div>
              <button
                onClick={() => upgrade(slot.slot)}
                disabled={upgrading === slot.slot || !canAfford}
                className={`theme-btn text-[10px] px-2 py-1 ${!canAfford ? 'opacity-40' : ''}`}
              >
                {upgrading === slot.slot ? '...' : `${cost.gold}🪙 ${cost.materials}⛏️`}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
