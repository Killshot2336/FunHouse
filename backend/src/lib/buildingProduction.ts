import { buildingRate } from './gameConfig.js';
import { getHotCrop, parseStockpile, type Stockpile } from './economyEngine.js';
import type { BuildingState } from './gameEngine.js';

export interface ProductionBonuses {
  skillFarmYield?: number;
  skillCropSpeed?: number;
  hotCrop?: string;
}

export interface WalletGains {
  gold: number;
  materials: number;
  food: number;
  faction: number;
}

export interface ProductionGains {
  wallet: WalletGains;
  stockpile: Stockpile;
}

const MAX_ACCRUE_HOURS = 8;

function elapsedHours(lastSeen: string, minSeconds = 0): number {
  const elapsedSec = Math.min(
    MAX_ACCRUE_HOURS * 3600,
    Math.max(0, (Date.now() - new Date(lastSeen).getTime()) / 1000)
  );
  if (elapsedSec < minSeconds) return 0;
  return elapsedSec / 3600;
}

function buildingMeta(building: BuildingState) {
  return (building.building_meta_json || {}) as { crop?: string; upgrades?: Record<string, number> };
}

/** HQ Command Center: +5% all building rates per level */
export function getHqRateMultiplier(buildings: BuildingState[]): number {
  const hq = buildings.find((b) => b.building_key === 'hq');
  if (!hq) return 1;
  const upgrades = buildingMeta(hq).upgrades || {};
  return 1 + (upgrades['1'] || 0) * 0.05;
}

export function getCropBuildingMultipliers(
  buildingKey: 'farm' | 'greenhouse',
  upgrades: Record<string, number>,
  bonuses: ProductionBonuses,
  cropKey: string
): { yieldMult: number; speedMult: number; cropMult: number } {
  const slot1Rate = buildingKey === 'greenhouse' ? 0.12 : 0.10;
  const slot2Rate = buildingKey === 'greenhouse' ? 0.10 : 0.08;
  const yieldMult = (1 + (upgrades['1'] || 0) * slot1Rate) * (bonuses.skillFarmYield || 1);
  const speedMult = (1 + (upgrades['2'] || 0) * slot2Rate) * (bonuses.skillCropSpeed || 1);
  let cropMult = yieldMult * speedMult;

  const hotCrop = bonuses.hotCrop ?? getHotCrop();
  if (buildingKey === 'greenhouse' && (upgrades['5'] || 0) >= 1 && cropKey === hotCrop) {
    cropMult *= 2;
  }

  return { yieldMult, speedMult, cropMult };
}

export function getResourceBuildingMultiplier(
  buildingKey: 'lumber_mill' | 'quarry',
  upgrades: Record<string, number>,
  bonuses: ProductionBonuses
): number {
  const slot1Rate = 0.10;
  const slot2Rate = 0.08;
  const yieldMult = 1 + (upgrades['1'] || 0) * slot1Rate;
  const speedMult = (1 + (upgrades['2'] || 0) * slot2Rate) * (bonuses.skillCropSpeed || 1);
  return yieldMult * speedMult * (bonuses.skillFarmYield || 1);
}

export function getWalletBuildingMultiplier(
  buildingKey: string,
  upgrades: Record<string, number>
): number {
  if (buildingKey === 'market') {
    return 1 + (upgrades['1'] || 0) * 0.08;
  }
  if (buildingKey === 'hq') {
    return 1 + (upgrades['2'] || 0) * 0.10;
  }
  if (buildingKey === 'shrine') {
    return 1 + (upgrades['1'] || 0) * 0.08;
  }
  return 1;
}

/** Market building slot 4: +5% crop/ore sell per level (any market) */
export function getMarketSellBonus(buildings: BuildingState[]): number {
  let bonus = 0;
  for (const b of buildings) {
    if (b.building_key !== 'market') continue;
    const upgrades = buildingMeta(b).upgrades || {};
    bonus += (upgrades['4'] || 0) * 0.05;
  }
  return 1 + bonus;
}

export function calcStockpileAccrual(
  buildings: BuildingState[],
  lastSeen: string,
  maxHours = MAX_ACCRUE_HOURS,
  bonuses: ProductionBonuses = {},
  minSeconds = 0
): Stockpile {
  const elapsed = Math.min(elapsedHours(lastSeen, minSeconds), maxHours);
  const stockpile = parseStockpile(null);
  if (elapsed < 0.0001) return stockpile;

  const hqMult = getHqRateMultiplier(buildings);
  const hotCrop = bonuses.hotCrop ?? getHotCrop();

  for (const b of buildings) {
    const rate = buildingRate(b.building_key, b.level) * elapsed * 60 * hqMult;
    const meta = buildingMeta(b);
    const upgrades = meta.upgrades || {};

    if (b.building_key === 'farm' || b.building_key === 'greenhouse') {
      const crop = meta.crop || 'corn';
      const { cropMult } = getCropBuildingMultipliers(
        b.building_key as 'farm' | 'greenhouse',
        upgrades,
        { ...bonuses, hotCrop },
        crop
      );
      stockpile.crops[crop] = (stockpile.crops[crop] || 0) + Math.floor(rate * cropMult);
    } else if (b.building_key === 'lumber_mill') {
      let mult = getResourceBuildingMultiplier('lumber_mill', upgrades, bonuses);
      if ((upgrades['5'] || 0) >= 1) mult *= 2;
      stockpile.wood += Math.floor(rate * mult);
    } else if (b.building_key === 'quarry') {
      stockpile.stone += Math.floor(rate * getResourceBuildingMultiplier('quarry', upgrades, bonuses));
    }
  }
  return stockpile;
}

export function calcOfflineWalletResources(
  buildings: BuildingState[],
  lastSeen: string,
  maxHours = MAX_ACCRUE_HOURS,
  minSeconds = 0
): WalletGains {
  const elapsed = Math.min(elapsedHours(lastSeen, minSeconds), maxHours);
  if (elapsed < 0.0001) return { gold: 0, materials: 0, food: 0, faction: 0 };

  const hqMult = getHqRateMultiplier(buildings);
  let gold = 0;
  let materials = 0;
  let faction = 0;

  for (const b of buildings) {
    const meta = buildingMeta(b);
    const upgrades = meta.upgrades || {};
    const rate = buildingRate(b.building_key, b.level) * elapsed * 60 * hqMult;
    const bld = b.building_key;

    if (['market', 'barracks', 'library', 'warehouse', 'tavern'].includes(bld)) {
      gold += rate * getWalletBuildingMultiplier(bld, upgrades);
    } else if (bld === 'mine') {
      materials += rate;
    } else if (bld === 'smithy') {
      const mult = 1 + (upgrades['1'] || 0) * 0.05;
      materials += rate * mult;
    } else if (bld === 'workshop') {
      const mult = 1 + (upgrades['1'] || 0) * 0.08;
      materials += rate * mult;
    } else if (bld === 'hq') {
      faction += rate * getWalletBuildingMultiplier('hq', upgrades);
    } else if (bld === 'shrine') {
      faction += rate * getWalletBuildingMultiplier('shrine', upgrades);
    }
  }

  return {
    gold: Math.floor(gold),
    materials: Math.floor(materials),
    food: 0,
    faction: Math.floor(faction),
  };
}

export function computeProductionGains(
  buildings: BuildingState[],
  lastSeen: string,
  bonuses: ProductionBonuses = {},
  minSeconds = 3
): ProductionGains {
  return {
    wallet: calcOfflineWalletResources(buildings, lastSeen, MAX_ACCRUE_HOURS, minSeconds),
    stockpile: calcStockpileAccrual(buildings, lastSeen, MAX_ACCRUE_HOURS, bonuses, minSeconds),
  };
}

/** Pending preview (0 min wait) for UI */
export function computePendingProduction(
  buildings: BuildingState[],
  lastSeen: string,
  bonuses: ProductionBonuses = {}
): ProductionGains {
  return computeProductionGains(buildings, lastSeen, bonuses, 0);
}

export function hasProductionGains(gains: ProductionGains): boolean {
  const w = gains.wallet;
  if (w.gold > 0 || w.materials > 0 || w.faction > 0) return true;
  const s = gains.stockpile;
  if (s.wood > 0 || s.stone > 0) return true;
  if (Object.values(s.crops).some((v) => v > 0)) return true;
  if (Object.values(s.ores).some((v) => v > 0)) return true;
  return false;
}

export function formatProductionGains(gains: ProductionGains): string {
  const parts: string[] = [];
  const w = gains.wallet;
  if (w.gold > 0) parts.push(`${w.gold}🪙`);
  if (w.materials > 0) parts.push(`${w.materials}⛏️`);
  if (w.faction > 0) parts.push(`${w.faction}⭐`);
  const s = gains.stockpile;
  const cropTotal = Object.values(s.crops).reduce((a, b) => a + b, 0);
  if (cropTotal > 0) parts.push(`${cropTotal}🌾`);
  if (s.wood > 0) parts.push(`${s.wood}🪵`);
  if (s.stone > 0) parts.push(`${s.stone}🪨`);
  const oreTotal = Object.values(s.ores).reduce((a, b) => a + b, 0);
  if (oreTotal > 0) parts.push(`${oreTotal}💎`);
  return parts.length ? parts.join(' · ') : '';
}

/** Barracks Armory: -5% recruit cost per level */
export function getBarracksRecruitDiscount(buildings: BuildingState[]): number {
  let discount = 0;
  for (const b of buildings) {
    if (b.building_key !== 'barracks') continue;
    const upgrades = buildingMeta(b).upgrades || {};
    discount += (upgrades['3'] || 0) * 0.05;
  }
  return Math.min(0.35, discount);
}

/** Market Bulk Deals slot 2 */
export function getMarketBulkSellBonus(buildings: BuildingState[]): number {
  let bonus = 0;
  for (const b of buildings) {
    if (b.building_key !== 'market') continue;
    const upgrades = buildingMeta(b).upgrades || {};
    bonus += (upgrades['2'] || 0) * 0.10;
  }
  return 1 + bonus;
}

/** Farm Market Bonus slot 4 per farm */
export function getFarmCropSellBonus(buildings: BuildingState[], cropKey: string): number {
  let bonus = 0;
  for (const b of buildings) {
    if (b.building_key !== 'farm' && b.building_key !== 'greenhouse') continue;
    const meta = buildingMeta(b);
    if ((meta.crop || 'corn') !== cropKey) continue;
    const upgrades = meta.upgrades || {};
    bonus += (upgrades['4'] || 0) * 0.05;
  }
  return 1 + bonus;
}

export function mergeStockpileDisplay(stored: unknown, pending: Stockpile): Stockpile {
  const base = parseStockpile(stored);
  for (const [k, v] of Object.entries(pending.crops)) {
    base.crops[k] = (base.crops[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(pending.ores)) {
    base.ores[k] = (base.ores[k] || 0) + v;
  }
  base.wood += pending.wood;
  base.stone += pending.stone;
  return base;
}
