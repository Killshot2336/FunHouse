import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { BUILDINGS, BUILDING_COSTS, buildingCost } from './gameConfig';
import type { GameState } from './CommanderVillage';

interface VillageMapProps {
  state: GameState;
  onUpdate: () => void;
}

export function VillageMap({ state, onUpdate }: VillageMapProps) {
  const { user, token } = useAuthStore();
  const [selectedBuilding, setSelectedBuilding] = useState('farm');
  const [placing, setPlacing] = useState(false);
  const size = state.commander.grid_size;

  const getBuildingAt = (x: number, y: number) =>
    state.buildings.find((b) => b.grid_x === x && b.grid_y === y);

  const placeOrUpgrade = async (x: number, y: number) => {
    const existing = getBuildingAt(x, y);
    setPlacing(true);
    try {
      await api('/game/build', {
        method: 'POST',
        body: JSON.stringify({
          building_key: existing?.building_key || selectedBuilding,
          grid_x: x,
          grid_y: y,
        }),
      }, token);
      playSound(user!.theme, 'buildPlace');
      onUpdate();
    } catch { /* ignore */ }
    setPlacing(false);
  };

  const collect = async () => {
    await api('/game/collect', { method: 'POST' }, token);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(BUILDINGS).map(([key, b]) => {
          const costs = BUILDING_COSTS[key];
          const cost = costs ? buildingCost(costs.base, costs.growth, 0) : 0;
          return (
            <button
              key={key}
              onClick={() => setSelectedBuilding(key)}
              className={`theme-card px-3 py-2 text-sm ${selectedBuilding === key ? 'border-2 border-current' : 'opacity-60'}`}
            >
              {b.icon} {b.name} ({cost}🪙)
            </button>
          );
        })}
        <button onClick={collect} className="theme-btn text-xs">Collect Resources</button>
      </div>

      <div
        className="grid gap-1 mx-auto"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, maxWidth: 360 }}
      >
        {Array.from({ length: size * size }).map((_, i) => {
          const x = i % size;
          const y = Math.floor(i / size);
          const bld = getBuildingAt(x, y);
          const bldInfo = bld ? BUILDINGS[bld.building_key] : null;
          return (
            <button
              key={i}
              onClick={() => !placing && placeOrUpgrade(x, y)}
              disabled={placing}
              className={`aspect-square theme-card flex flex-col items-center justify-center text-xs p-1 transition-all hover:scale-105 ${
                bld ? 'build-place' : 'opacity-40'
              }`}
            >
              {bldInfo ? (
                <>
                  <span className="text-lg">{bldInfo.icon}</span>
                  <span>Lv.{bld!.level}</span>
                </>
              ) : (
                <span className="opacity-30">+</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs opacity-50 text-center">Tap empty cell to build. Tap existing to upgrade.</p>
    </div>
  );
}
