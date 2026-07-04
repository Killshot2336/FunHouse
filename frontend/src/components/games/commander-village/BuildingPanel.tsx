import { motion } from 'framer-motion';
import { BUILDINGS, BUILDING_COSTS, buildingCost } from './gameConfig';
import type { GameState } from './CommanderVillage';

const RESOURCE_ICONS: Record<string, string> = {
  gold: '🪙',
  materials: '⛏️',
  food: '🌾',
  faction: '⭐',
};

interface BuildingPanelProps {
  state: GameState;
  x: number;
  y: number;
  liveAmount: number;
  ratePerHour: number;
  onUpgrade: () => void;
  onClose: () => void;
  upgrading: boolean;
}

export function BuildingPanel({
  state, x, y, liveAmount, ratePerHour, onUpgrade, onClose, upgrading,
}: BuildingPanelProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="theme-card p-4 space-y-3"
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
        <div className="text-xs opacity-50">{ratePerHour.toFixed(1)}/hr</div>
      </div>

      <div className="text-xs opacity-60">
        Upgrade to Lv.{building.level + 1} for {upgradeCost}🪙
      </div>

      <button
        onClick={onUpgrade}
        disabled={upgrading || !canAfford}
        className={`theme-btn theme-btn-primary w-full text-sm py-2 ${!canAfford ? 'opacity-40' : ''}`}
      >
        {upgrading ? 'Upgrading...' : canAfford ? `Upgrade (${upgradeCost}🪙)` : 'Not enough gold'}
      </button>
    </motion.div>
  );
}
