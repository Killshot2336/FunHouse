import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { COSMETIC_OPTIONS } from './gameConfig';
import type { GameState } from './CommanderVillage';

interface ArmyRosterProps {
  state: GameState;
  onUpdate: () => void;
}

export function ArmyRoster({ state, onUpdate }: ArmyRosterProps) {
  const { user, token } = useAuthStore();
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const recruit = async (unitKey: string) => {
    try {
      await api('/game/recruit', { method: 'POST', body: JSON.stringify({ unit_key: unitKey }) }, token);
      playSound(user!.theme, 'craft');
      onUpdate();
    } catch { /* ignore */ }
  };

  const upgradeStat = async (unitId: string, stat: string) => {
    setUpgrading(true);
    try {
      await api(`/game/units/${unitId}/upgrade`, { method: 'POST', body: JSON.stringify({ stat }) }, token);
      onUpdate();
    } catch { /* ignore */ }
    setUpgrading(false);
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
        <div className="grid grid-cols-2 gap-2">
          {state.units.map((unit) => {
            const def = unitDef(unit.unit_key);
            return (
              <button
                key={unit.id}
                onClick={() => setSelectedUnit(unit.id)}
                className={`theme-card p-3 text-left ${selectedUnit === unit.id ? 'border-2 border-current' : ''}`}
              >
                <div className="text-2xl">{def?.icon || '👤'}</div>
                <div className="font-bold text-sm">{def?.name || unit.unit_key}</div>
                <div className="text-xs opacity-60">
                  ATK {unit.stats.atk} DEF {unit.stats.def} SPD {unit.stats.spd}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="theme-card p-4 space-y-3">
          <h3 className="font-bold text-sm">Customize & Upgrade</h3>
          <div className="flex flex-wrap gap-2">
            {(['atk', 'def', 'spd', 'luck'] as const).map((stat) => (
              <button
                key={stat}
                onClick={() => upgradeStat(selected.id, stat)}
                disabled={upgrading}
                className="theme-btn text-xs uppercase"
              >
                +{stat} ({selected.stats[stat]})
              </button>
            ))}
          </div>
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
      )}
    </div>
  );
}
