import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { BUILDINGS, BUILDING_COSTS, buildingCost } from './gameConfig';
import { BuildingPanel } from './BuildingPanel';
import type { GameState } from './CommanderVillage';

const RESOURCE_ICONS: Record<string, string> = {
  gold: '🪙',
  materials: '⛏️',
  food: '🌾',
  faction: '⭐',
};

interface VillageMapProps {
  state: GameState;
  onUpdate: () => void;
}

export function VillageMap({ state, onUpdate }: VillageMapProps) {
  const { user, token } = useAuthStore();
  const [selectedBuilding, setSelectedBuilding] = useState('farm');
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const size = state.commander.grid_size;

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const hoursSince = (tick - new Date(state.commander.last_seen_at).getTime()) / 3600000;

  const accruedById = useMemo(() => {
    const map = new Map<string, { liveAmount: number; ratePerHour: number; resource: string }>();
    for (const b of state.building_accrued || []) {
      map.set(b.id, {
        liveAmount: b.amount + b.ratePerHour * hoursSince,
        ratePerHour: b.ratePerHour,
        resource: b.resource,
      });
    }
    return map;
  }, [state.building_accrued, hoursSince]);

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

  const handleTileClick = (x: number, y: number) => {
    setSelectedTile({ x, y });
    const existing = getBuildingAt(x, y);
    if (!existing && !placing) {
      placeOrUpgrade(x, y);
    }
  };

  const selectedBuildingData = selectedTile ? getBuildingAt(selectedTile.x, selectedTile.y) : null;
  const selectedAccrued = selectedBuildingData ? accruedById.get(selectedBuildingData.id) : null;

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
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">
        <div
          className="grid gap-1 mx-auto md:mx-0 flex-shrink-0"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`, maxWidth: 360 }}
        >
          {Array.from({ length: size * size }).map((_, i) => {
            const x = i % size;
            const y = Math.floor(i / size);
            const bld = getBuildingAt(x, y);
            const bldInfo = bld ? BUILDINGS[bld.building_key] : null;
            const accrued = bld ? accruedById.get(bld.id) : null;
            const isSelected = selectedTile?.x === x && selectedTile?.y === y;

            return (
              <button
                key={i}
                onClick={() => handleTileClick(x, y)}
                disabled={placing}
                className={`aspect-square theme-card flex flex-col items-center justify-center text-xs p-1 transition-all hover:scale-105 relative ${
                  bld ? 'build-place' : 'opacity-40'
                } ${isSelected ? 'border-2 border-current ring-1 ring-current/50' : ''}`}
              >
                {bldInfo ? (
                  <>
                    <span className="text-lg">{bldInfo.icon}</span>
                    <span>Lv.{bld!.level}</span>
                    {accrued && accrued.liveAmount >= 0.1 && (
                      <span className="absolute -top-1 -right-1 text-[9px] bg-black/80 px-1 rounded border border-current/30 animate-pulse">
                        +{accrued.liveAmount.toFixed(0)}{RESOURCE_ICONS[accrued.resource]}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="opacity-30">+</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedTile && (
          <div className="flex-1 w-full md:max-w-xs">
            <BuildingPanel
              state={state}
              x={selectedTile.x}
              y={selectedTile.y}
              liveAmount={selectedAccrued?.liveAmount || 0}
              ratePerHour={selectedAccrued?.ratePerHour || 0}
              upgrading={placing}
              onClose={() => setSelectedTile(null)}
              onUpgrade={() => placeOrUpgrade(selectedTile.x, selectedTile.y)}
            />
          </div>
        )}
      </div>

      <p className="text-xs opacity-50 text-center">
        Tap empty cell to build · Tap building to open panel & upgrade · Resources auto-collect
      </p>
    </div>
  );
}
