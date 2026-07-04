import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { COSMETIC_OPTIONS } from './gameConfig';
import { TroopCard } from './TroopCard';
import { TroopSkillTree } from './TroopSkillTree';
import type { GameState } from './CommanderVillage';
import type { Rarity } from './gameConfig';

interface ArmyRosterProps {
  state: GameState;
  onUpdate: () => void;
}

function getEquippedLabel(unit: GameState['units'][0], inventory: GameState['inventory']): string | undefined {
  const weaponId = unit.equipment?.weapon;
  if (!weaponId) return undefined;
  const item = inventory.find((i) => i.id === weaponId);
  return item?.name;
}

export function ArmyRoster({ state, onUpdate }: ArmyRosterProps) {
  const { user, token } = useAuthStore();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const recruit = async (unitKey: string) => {
    try {
      await api('/game/recruit', { method: 'POST', body: JSON.stringify({ unit_key: unitKey }) }, token);
      playSound(user!.theme, 'craft');
      onUpdate();
    } catch { /* ignore */ }
  };

  const updateCosmetic = async (unitId: string, key: string, value: string) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return;
    await api(`/game/units/${unitId}/cosmetics`, {
      method: 'PATCH',
      body: JSON.stringify({ cosmetics: { ...unit.cosmetics, [key]: value } }),
    }, token);
    onUpdate();
  };

  const unitDef = (key: string) => state.config.units.find((u) => u.key === key);
  const selected = state.units.find((u) => u.id === selectedUnit);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold mb-2">Recruit Units</h3>
        <div className="flex flex-wrap gap-2">
          {state.config.units.map((u) => (
            <button key={u.key} onClick={() => recruit(u.key)} className="theme-card px-3 py-2 text-sm hover:scale-105 transition-all">
              {u.icon} {u.name} — {u.baseCost}🪙
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2">Your Army ({state.units.length}/6)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {state.units.map((unit) => {
            const def = unitDef(unit.unit_key);
            const rarity = ((unit as { rarity?: string }).rarity || (unit.stats as { rarity?: string }).rarity || 'common') as Rarity;
            return (
              <TroopCard
                key={unit.id}
                name={def?.name || unit.unit_key}
                icon={def?.icon || '👤'}
                rarity={rarity}
                stats={unit.stats as Record<string, unknown>}
                equipmentLabel={getEquippedLabel(unit, state.inventory)}
                selected={selectedUnit === unit.id}
                onClick={() => setSelectedUnit(unit.id)}
              />
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="space-y-4">
          <TroopSkillTree state={state} unitId={selected.id} onUpdate={onUpdate} />
          <div className="theme-card p-4 space-y-3">
            <h3 className="font-bold text-sm">Cosmetics</h3>
            {Object.entries(COSMETIC_OPTIONS).map(([key, options]) => (
              <div key={key}>
                <div className="text-xs uppercase opacity-60 mb-1">{key}</div>
                <div className="flex flex-wrap gap-1">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => updateCosmetic(selected.id, key, opt)}
                      className={`theme-btn text-xs px-2 py-1 ${selected.cosmetics[key] === opt ? 'theme-btn-primary' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
