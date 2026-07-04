import {
  LOOT_TABLE,
  RARITY_WEIGHTS,
  buildingRate,
  calcPowerRating,
  normalizeCombatStats,
  defaultCombatStats,
  RARITY_STAT_MULT,
  UNITS_BY_PATRON,
  type Rarity,
  type Patron,
} from './gameConfig.js';
import { parseStockpile, type Stockpile } from './economyEngine.js';

export interface CommanderState {
  user_id: string;
  patron: string;
  gold: number;
  materials: number;
  food: number;
  faction_currency: number;
  village_level: number;
  power_rating: number;
  story_chapter: number;
  story_seen: boolean;
  grid_size: number;
  last_seen_at: string;
}

export interface BuildingState {
  id: string;
  user_id: string;
  building_key: string;
  grid_x: number;
  grid_y: number;
  level: number;
  building_meta_json?: Record<string, unknown>;
}

export interface UnitState {
  id: string;
  user_id: string;
  unit_key: string;
  slot_index: number;
  stats: { atk: number; def: number; spd: number; luck: number };
  cosmetics: { armor: string; aura: string; weapon: string; banner: string };
  equipment: Record<string, string | null>;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  name: string;
  rarity: Rarity;
  stats: Record<string, number>;
  quantity: number;
  equipped_to_unit: string | null;
}

export interface MissionState {
  mission_key: string;
  status: 'active' | 'completed';
  progress: number;
}

export interface PityState {
  rolls_since_rare: number;
  rolls_since_legendary: number;
}

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

/** Hidden server-side luck — never exposed to clients */
function applyHiddenLuck(userId: string | undefined, rarity: Rarity): Rarity {
  if (userId !== 'jamie' || rarity === 'mythic') return rarity;
  if (Math.random() < 0.05) {
    const idx = RARITY_ORDER.indexOf(rarity);
    return RARITY_ORDER[Math.min(idx + 1, RARITY_ORDER.length - 1)];
  }
  return rarity;
}

/** Hidden duel power boost for jamie — not shown in UI */
export function applyHiddenDuelLuck(userId: string, power: number): number {
  if (userId === 'jamie') return power * 1.05;
  return power;
}

export function rollRarity(pity: PityState, userId?: string): { rarity: Rarity; newPity: PityState } {
  const newPity = { ...pity, rolls_since_rare: pity.rolls_since_rare + 1, rolls_since_legendary: pity.rolls_since_legendary + 1 };

  if (newPity.rolls_since_legendary >= 300) {
    newPity.rolls_since_legendary = 0;
    newPity.rolls_since_rare = 0;
    return { rarity: applyHiddenLuck(userId, 'legendary'), newPity };
  }
  if (newPity.rolls_since_rare >= 40) {
    newPity.rolls_since_rare = 0;
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      if (rarity === 'common' || rarity === 'uncommon') continue;
      cumulative += weight;
      if (roll < cumulative) return { rarity: applyHiddenLuck(userId, rarity as Rarity), newPity };
    }
    return { rarity: applyHiddenLuck(userId, 'rare'), newPity };
  }

  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) return { rarity: applyHiddenLuck(userId, rarity as Rarity), newPity };
  }
  return { rarity: applyHiddenLuck(userId, 'common'), newPity };
}

export function rollLoot(pity: PityState, userId?: string): { item: typeof LOOT_TABLE[0]; newPity: PityState } {
  const { rarity, newPity } = rollRarity(pity, userId);
  const pool = LOOT_TABLE.filter((i) => i.rarity === rarity);
  const item = pool[Math.floor(Math.random() * pool.length)] || LOOT_TABLE[0];
  const variance = 0.85 + Math.random() * 0.3;
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(item.stats)) {
    stats[k] = Math.floor(v * variance);
  }
  return { item: { ...item, stats }, newPity };
}

export function calcBuildingAccrued(
  buildings: BuildingState[],
  lastSeen: string,
  maxHours = 8
): Array<{
  id: string;
  building_key: string;
  grid_x: number;
  grid_y: number;
  resource: 'gold' | 'materials' | 'food' | 'faction' | 'crop' | 'wood' | 'stone';
  amount: number;
  ratePerHour: number;
}> {
  const elapsed = Math.min(
    (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60),
    maxHours
  );
  if (elapsed < 0) return [];

  const resourceMap: Record<string, 'gold' | 'materials' | 'food' | 'faction' | 'crop' | 'wood' | 'stone'> = {
    market: 'gold',
    mine: 'materials',
    farm: 'crop',
    greenhouse: 'crop',
    hq: 'faction',
    shrine: 'faction',
    lumber_mill: 'wood',
    quarry: 'stone',
    smithy: 'materials',
    barracks: 'gold',
    library: 'gold',
    warehouse: 'gold',
    workshop: 'materials',
    tavern: 'gold',
  };

  return buildings.map((b) => {
    const ratePerHour = buildingRate(b.building_key, b.level) * 60;
    const amount = ratePerHour * elapsed;
    return {
      id: b.id,
      building_key: b.building_key,
      grid_x: b.grid_x,
      grid_y: b.grid_y,
      resource: resourceMap[b.building_key] || 'gold',
      amount: Math.round(amount * 10) / 10,
      ratePerHour: Math.round(ratePerHour * 10) / 10,
    };
  });
}

export function calcOfflineResources(
  buildings: BuildingState[],
  lastSeen: string,
  maxHours = 8
): { gold: number; materials: number; food: number; faction: number } {
  const elapsed = Math.min(
    (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60),
    maxHours
  );
  if (elapsed < 0.01) return { gold: 0, materials: 0, food: 0, faction: 0 };

  let gold = 0, materials = 0, food = 0, faction = 0;
  for (const b of buildings) {
    const rate = buildingRate(b.building_key, b.level) * elapsed * 60;
    const bld = b.building_key;
    if (bld === 'market' || bld === 'barracks' || bld === 'library' || bld === 'warehouse' || bld === 'tavern') gold += rate;
    else if (bld === 'mine' || bld === 'smithy' || bld === 'workshop') materials += rate;
    else if (bld === 'farm') food += rate;
    else if (bld === 'hq' || bld === 'shrine') faction += rate;
  }
  return {
    gold: Math.floor(gold),
    materials: Math.floor(materials),
    food: Math.floor(food),
    faction: Math.floor(faction),
  };
}

export function calcStockpileAccrual(
  buildings: BuildingState[],
  lastSeen: string,
  maxHours = 8
): Stockpile {
  const elapsed = Math.min(
    (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60),
    maxHours
  );
  const stockpile = parseStockpile(null);
  if (elapsed < 0.01) return stockpile;

  for (const b of buildings) {
    const rate = buildingRate(b.building_key, b.level) * elapsed * 60;
    const meta = (b.building_meta_json || {}) as { crop?: string; upgrades?: Record<string, number> };
    const yieldMult = 1 + ((meta.upgrades?.['1'] || 0) * 0.1);

    if (b.building_key === 'farm' || b.building_key === 'greenhouse') {
      const crop = meta.crop || 'corn';
      stockpile.crops[crop] = (stockpile.crops[crop] || 0) + Math.floor(rate * yieldMult);
    } else if (b.building_key === 'lumber_mill') {
      stockpile.wood += Math.floor(rate * yieldMult);
    } else if (b.building_key === 'quarry') {
      stockpile.stone += Math.floor(rate * yieldMult);
    }
  }
  return stockpile;
}

export function mergeStockpile(existing: unknown, accrual: Stockpile): Stockpile {
  const base = parseStockpile(existing);
  for (const [k, v] of Object.entries(accrual.crops)) {
    base.crops[k] = (base.crops[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(accrual.ores)) {
    base.ores[k] = (base.ores[k] || 0) + v;
  }
  base.wood += accrual.wood;
  base.stone += accrual.stone;
  return base;
}

export function defaultUnitStats(): { atk: number; def: number; spd: number; luck: number; health: number; damage: number; shield: number; skill_nodes: string[] } {
  const combat = defaultCombatStats('common');
  return { atk: combat.damage, def: Math.floor(combat.shield * 2), spd: 4, luck: 2, ...combat };
}

export function rollPackLoot(
  pity: PityState,
  itemTypes: string | string[],
  userId?: string
): {
  itemId: string;
  name: string;
  rarity: Rarity;
  stats: Record<string, number>;
  item_type: string;
  newPity: PityState;
} {
  const { rarity, newPity } = rollRarity(pity, userId);
  const types = Array.isArray(itemTypes) ? itemTypes : [itemTypes];
  let pool = LOOT_TABLE.filter((i) => types.includes(i.item_type) && i.rarity === rarity);
  if (pool.length === 0) pool = LOOT_TABLE.filter((i) => types.includes(i.item_type));
  const item = pool[Math.floor(Math.random() * pool.length)] || LOOT_TABLE[1];
  const variance = 0.85 + Math.random() * 0.3;
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(item.stats)) {
    stats[k] = Math.floor(v * variance);
  }
  return { itemId: item.id, name: item.name, rarity, stats, item_type: item.item_type, newPity };
}

export function rollPackUnit(patron: Patron, pity: PityState, userId?: string): {
  unitKey: string;
  name: string;
  icon: string;
  rarity: Rarity;
  stats: ReturnType<typeof defaultUnitStats>;
  newPity: PityState;
} {
  const { rarity, newPity } = rollRarity(pity, userId);
  const pool = UNITS_BY_PATRON[patron];
  const unitDef = pool[Math.floor(Math.random() * pool.length)];
  const combat = defaultCombatStats(rarity);
  return {
    unitKey: unitDef.key,
    name: unitDef.name,
    icon: unitDef.icon,
    rarity,
    stats: { atk: combat.damage, def: Math.floor(combat.shield * 2), spd: 4 + Math.floor(RARITY_STAT_MULT[rarity]), luck: 2 + Math.floor(RARITY_STAT_MULT[rarity] * 2), ...combat },
    newPity,
  };
}

export { calcPowerRating, normalizeCombatStats };

export function applyItemStatsToUnit(
  unitStats: Record<string, unknown>,
  itemStats: Record<string, number>
): Record<string, unknown> {
  const out = { ...unitStats };
  for (const [k, v] of Object.entries(itemStats)) {
    if (k === 'atk') {
      out.atk = Number(out.atk ?? out.damage ?? 5) + v;
      out.damage = Number(out.damage ?? out.atk ?? 5) + v;
    } else if (k === 'def') {
      out.def = Number(out.def ?? 3) + v;
      const shieldBonus = Math.floor(v / 2) + 2;
      out.shield = Number(out.shield ?? 8) + shieldBonus;
      out.health = Number(out.health ?? Number(out.def) * 10) + v * 5;
    } else {
      out[k] = Number(out[k] ?? 0) + v;
    }
  }
  return out;
}

export function formatItemStatBonus(itemStats: Record<string, number>): string {
  const labels: Record<string, string> = {
    atk: 'ATK', def: 'DEF', spd: 'SPD', luck: 'LUCK',
  };
  const parts = Object.entries(itemStats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `+${v} ${labels[k] || k.toUpperCase()}`);
  return parts.join(', ') || 'equipped';
}
