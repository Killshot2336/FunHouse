import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { BUILDINGS, BUILDING_COSTS, buildingCost, getUnlockedCrops, CROP_TYPES } from './gameConfig';
import { BuildingUpgrades } from './BuildingUpgrades';
import { formatMinSec, mergeStockpileDisplay } from './productionFormat';
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
  onUpdate: () => void;
  onLevelUpgrade: () => void;
  onClose: () => void;
  upgrading: boolean;
}

const STOCKPILE_BUILDINGS = ['farm', 'greenhouse', 'lumber_mill', 'quarry'] as const;

export function BuildingPanel({
  state, x, y, liveAmount, ratePerMin, elapsedSec, onUpdate, onLevelUpgrade, onClose, upgrading,
}: BuildingPanelProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [collecting, setCollecting] = useState(false);
  const building = state.buildings.find((b) => b.grid_x === x && b.grid_y === y);

  const stockpile = mergeStockpileDisplay(
    state.commander.stockpile_json || { crops: {}, ores: {}, wood: 0, stone: 0 },
    state.pending_stockpile
  );

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
  const activeCrop = meta.crop || 'corn';
  const cropQty = isCropBuilding ? (stockpile.crops[activeCrop] || 0) : 0;
  const pendingCrop = isCropBuilding ? (state.pending_stockpile?.crops[activeCrop] || 0) : 0;
  const needsHarvest = STOCKPILE_BUILDINGS.includes(building.building_key as typeof STOCKPILE_BUILDINGS[number]);

  const harvestAll = async () => {
    setCollecting(true);
    try {
      const res = await api<{ summary?: string }>('/game/collect', { method: 'POST' }, token);
      playSound(user!.theme, 'craft');
      notify(
        res.summary
          ? `Harvested ${res.summary} — check Market tab to sell crops/ore`
          : 'Harvested! Resources added to stockpile.',
        'success'
      );
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Harvest failed', 'error');
    }
    setCollecting(false);
  };

  const setCrop = async (crop: string) => {
    if (!unlockedCrops.includes(crop)) {
      notify('Upgrade Crop Slot (slot 3) to unlock more crops', 'info');
      return;
    }
    try {
      if (pendingCrop > 0 || liveAmount >= 0.5) {
        await api('/game/collect', { method: 'POST' }, token);
      }
      await api(`/game/buildings/${building.id}/crop`, {
        method: 'POST',
        body: JSON.stringify({ crop }),
      }, token);
      const cropName = CROP_TYPES.find((c) => c.key === crop)?.name || crop;
      notify(`Now growing ${cropName}`, 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Crop change failed', 'error');
    }
  };

  const collectMine = async () => {
    setCollecting(true);
    try {
      await api('/game/mine/collect', {
        method: 'POST',
        body: JSON.stringify({ building_id: building.id }),
      }, token);
      playSound(user!.theme, 'craft');
      notify('Ores collected!', 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Mine collect failed', 'error');
    }
    setCollecting(false);
  };

  const harvestLabel =
    building.building_key === 'farm' || building.building_key === 'greenhouse'
      ? '🌾 Harvest Crops'
      : building.building_key === 'lumber_mill'
        ? '🪵 Harvest Wood'
        : building.building_key === 'quarry'
          ? '🪨 Harvest Stone'
          : 'Harvest';

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
        <div className="text-xs opacity-60 mb-1">Growing / producing</div>
        <div className="text-lg font-bold glow-text">
          +{liveAmount.toFixed(1)} {resourceIcon}
          {isCropBuilding && (
            <span className="text-sm font-normal opacity-70 ml-1">
              ({CROP_TYPES.find((c) => c.key === activeCrop)?.name || activeCrop})
            </span>
          )}
        </div>
        <div className="text-xs opacity-50">+{ratePerMin.toFixed(2)}/min · running {formatMinSec(elapsedSec)}</div>
        {isCropBuilding && (
          <div className="text-xs mt-2 opacity-70">
            Stockpile: <strong>{cropQty}</strong> {activeCrop}
            {pendingCrop > 0 && <span className="text-green-400"> (+{pendingCrop} ready to harvest)</span>}
          </div>
        )}
        {building.building_key === 'lumber_mill' && (
          <div className="text-xs mt-2 opacity-70">Stockpile: <strong>{stockpile.wood}</strong> wood</div>
        )}
        {building.building_key === 'quarry' && (
          <div className="text-xs mt-2 opacity-70">Stockpile: <strong>{stockpile.stone}</strong> stone</div>
        )}
      </div>

      {isCropBuilding && (
        <div>
          <div className="text-xs font-bold mb-1">Crop Type</div>
          <p className="text-[10px] opacity-50 mb-2">
            Upgrade slot 3 to unlock pumpkin/berries (Lv1) and mushrooms/herbs (Lv2)
          </p>
          <div className="flex flex-wrap gap-1">
            {CROP_TYPES.map((crop) => {
              const unlocked = unlockedCrops.includes(crop.key);
              return (
                <button
                  key={crop.key}
                  disabled={!unlocked}
                  onClick={() => setCrop(crop.key)}
                  className={`theme-btn text-xs px-2 py-1 ${activeCrop === crop.key ? 'theme-btn-primary' : ''} ${!unlocked ? 'opacity-30' : ''}`}
                  title={unlocked ? crop.name : 'Upgrade Crop Slot to unlock'}
                >
                  {crop.icon} {crop.name}{!unlocked ? ' 🔒' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {needsHarvest && (
        <button
          onClick={harvestAll}
          disabled={collecting}
          className="theme-btn theme-btn-primary w-full text-sm py-2"
        >
          {collecting ? 'Harvesting...' : harvestLabel}
        </button>
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
        onClick={onLevelUpgrade}
        disabled={upgrading || !canAfford}
        className={`theme-btn w-full text-sm py-2 ${!canAfford ? 'opacity-40' : ''}`}
      >
        {upgrading ? 'Upgrading...' : canAfford ? `Upgrade Level (${upgradeCost}🪙)` : 'Not enough gold'}
      </button>

      <BuildingUpgrades state={state} building={building} onUpdate={onUpdate} />
    </motion.div>
  );
}
