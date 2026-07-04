import {
  LOOT_TABLE,
  RARITY_WEIGHTS,
  buildingRate,
  calcPowerRating,
  type Rarity,
} from './gameConfig.js';

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

export function rollRarity(pity: PityState): { rarity: Rarity; newPity: PityState } {
  const newPity = { ...pity, rolls_since_rare: pity.rolls_since_rare + 1, rolls_since_legendary: pity.rolls_since_legendary + 1 };

  if (newPity.rolls_since_legendary >= 300) {
    newPity.rolls_since_legendary = 0;
    newPity.rolls_since_rare = 0;
    return { rarity: 'legendary', newPity };
  }
  if (newPity.rolls_since_rare >= 40) {
    newPity.rolls_since_rare = 0;
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      if (rarity === 'common' || rarity === 'uncommon') continue;
      cumulative += weight;
      if (roll < cumulative) return { rarity: rarity as Rarity, newPity };
    }
    return { rarity: 'rare', newPity };
  }

  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) return { rarity: rarity as Rarity, newPity };
  }
  return { rarity: 'common', newPity };
}

export function rollLoot(pity: PityState): { item: typeof LOOT_TABLE[0]; newPity: PityState } {
  const { rarity, newPity } = rollRarity(pity);
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
  resource: 'gold' | 'materials' | 'food' | 'faction';
  amount: number;
  ratePerHour: number;
}> {
  const elapsed = Math.min(
    (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60),
    maxHours
  );
  if (elapsed < 0) return [];

  const resourceMap: Record<string, 'gold' | 'materials' | 'food' | 'faction'> = {
    market: 'gold',
    mine: 'materials',
    farm: 'food',
    hq: 'faction',
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
    if (bld === 'market') gold += rate;
    else if (bld === 'mine') materials += rate;
    else if (bld === 'farm') food += rate;
    else if (bld === 'hq') faction += rate;
  }
  return {
    gold: Math.floor(gold),
    materials: Math.floor(materials),
    food: Math.floor(food),
    faction: Math.floor(faction),
  };
}

export function defaultUnitStats(): { atk: number; def: number; spd: number; luck: number } {
  return { atk: 5, def: 3, spd: 4, luck: 2 };
}

export { calcPowerRating };
