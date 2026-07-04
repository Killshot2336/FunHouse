import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../stores';
import { api } from '../../../lib/api';
import { BUILDINGS, BUILDING_COSTS, buildingCost, getUnlockedCrops, CROP_TYPES } from './gameConfig';
import { BuildingUpgrades } from './BuildingUpgrades';
import { formatMinSec } from './productionFormat';
import type { GameState } from './CommanderVillage';

const RESOURCE_ICONS: Record<string, string> = {
  gold: '🪙',
  materials: '⛏️',
  food: '🌾',
  faction: '⭐',
  crop: '🌽',
  wood: '🪵',
  stone: '🪨',
};

interface BuildingPanelProps {
  state: GameState;
  x: number;
  y: number;
  liveAmount: number;
  ratePerMin: number;
  elapsedSec: number;
  onUpgrade: () => void;
  onClose: () => void;
  upgrading: boolean;
}

export function BuildingPanel({
  state, x, y, liveAmount, ratePerMin, elapsedSec, onUpgrade, onClose, upgrading,
}: BuildingPanelProps) {
  const { token } = useAuthStore();
  const [collecting, setCollecting] = useState(false);
  const building = state.buildings.find((b) => b.grid_x === x && b.grid_y === y);

  if (!building) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="theme-card p-4 space-y-3"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold">Empty Plot ({x},{y})</h3>
          <button onClick={onClose} className="text-xs opacity-50">✕</button>
        </div>
        <p className="text-xs opacity-60">Select a building type above, then tap this tile to place.</p>
      </motion.div>
    );
  }

  const info = BUILDINGS[building.building_key];
  const costs = BUILDING_COSTS[building.building_key];
  const upgradeCost = costs ? buildingCost(costs.base, costs.growth, building.level) : 0;
  const canAfford = state.commander.gold >= upgradeCost;
  const resourceIcon = RESOURCE_ICONS[info?.resource || 'gold'] || '🪙';
  const meta = (building.building_meta_json || { upgrades: {}, crop: 'corn' }) as {
    upgrades: Record<string, number>;
    crop?: string;
  };
  const isCropBuilding = ['farm', 'greenhouse'].includes(building.building_key);
  const unlockedCrops = getUnlockedCrops(meta.upgrades || {});

  const setCrop = async (crop: string) => {
    await api(`/game/buildings/${building.id}/crop`, {
      method: 'POST',
      body: JSON.stringify({ crop }),
    }, token);
    onUpgrade();
  };

  const collectMine = async () => {
    setCollecting(true);
    try {
      await api('/game/mine/collect', {
        method: 'POST',
        body: JSON.stringify({ building_id: building.id }),
      }, token);
      onUpgrade();
    } catch { /* ignore */ }
    setCollecting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="theme-card p-4 space-y-3 max-h-[70vh] overflow-y-auto"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{info?.icon}</span>
          <div>
            <h3 className="text-sm font-bold">{info?.name}</h3>
            <p className="text-xs opacity-50">Level {building.level} · ({x},{y})</p>
          </div>
        </div>
        <button onClick={onClose} className="text-xs opacity-50 hover:opacity-100">✕</button>
      </div>

      <div className="p-3 rounded-lg border border-current/20 bg-black/20">
        <div className="text-xs opacity-60 mb-1">Idle production</div>
        <div className="text-lg font-bold glow-text">
          +{liveAmount.toFixed(1)} {resourceIcon}
        </div>
        <div className="text-xs opacity-50">+{ratePerMin.toFixed(2)}/min · building for {formatMinSec(elapsedSec)}</div>
        {isCropBuilding && meta.crop && (
          <div className="text-xs mt-1 opacity-60">
            Growing: {CROP_TYPES.find((c) => c.key === meta.crop)?.icon} {meta.crop}
          </div>
        )}
      </div>

      {isCropBuilding && (
        <div>
          <div className="text-xs font-bold mb-1">Crop Type</div>
          <div className="flex flex-wrap gap-1">
            {unlockedCrops.map((cropKey) => {
              const crop = CROP_TYPES.find((c) => c.key === cropKey);
              return (
                <button
                  key={cropKey}
                  onClick={() => setCrop(cropKey)}
                  className={`theme-btn text-xs px-2 py-1 ${meta.crop === cropKey ? 'theme-btn-primary' : ''}`}
                >
                  {crop?.icon} {crop?.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {building.building_key === 'mine' && (
        <button
          onClick={collectMine}
          disabled={collecting}
          className="theme-btn theme-btn-primary w-full text-sm py-2"
        >
          {collecting ? 'Mining...' : `⛏️ Collect Ores (Pickaxe T${state.commander.pickaxe_tier || 1})`}
        </button>
      )}

      <div className="text-xs opacity-60">
        Level upgrade to Lv.{building.level + 1} for {upgradeCost}🪙
      </div>

      <button
        onClick={onUpgrade}
        disabled={upgrading || !canAfford}
        className={`theme-btn w-full text-sm py-2 ${!canAfford ? 'opacity-40' : ''}`}
      >
        {upgrading ? 'Upgrading...' : canAfford ? `Upgrade Level (${upgradeCost}🪙)` : 'Not enough gold'}
      </button>

      <BuildingUpgrades state={state} building={building} onUpdate={onUpgrade} />
    </motion.div>
  );
}
