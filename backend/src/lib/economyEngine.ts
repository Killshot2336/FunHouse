import { LOOT_TABLE, CROP_TYPES, ORE_TYPES, type Rarity } from './gameConfig.js';

export interface Stockpile {
  crops: Record<string, number>;
  ores: Record<string, number>;
  wood: number;
  stone: number;
}

export function emptyStockpile(): Stockpile {
  return { crops: {}, ores: {}, wood: 0, stone: 0 };
}

export function parseStockpile(raw: unknown): Stockpile {
  const s = (raw || {}) as Partial<Stockpile>;
  return {
    crops: s.crops || {},
    ores: s.ores || {},
    wood: s.wood || 0,
    stone: s.stone || 0,
  };
}

export function itemSellPrice(itemId: string, rarity: string): number {
  const def = LOOT_TABLE.find((i) => i.id === itemId);
  if (def) return def.sellValue;
  const fallback: Record<string, number> = {
    common: 5, uncommon: 25, rare: 75, epic: 200, legendary: 500, mythic: 2000,
  };
  return fallback[rarity] || 5;
}

export function getMarketHourSeed(now = Date.now()): number {
  return Math.floor(now / 3600000);
}

export function getDungeonSeed(now = Date.now()): number {
  return Math.floor(now / 1800000);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function getCropPrices(hourSeed = getMarketHourSeed()): Record<string, number> {
  const rand = seededRandom(hourSeed);
  const hotIndex = Math.floor(rand() * CROP_TYPES.length);
  const prices: Record<string, number> = {};
  CROP_TYPES.forEach((c, i) => {
    const base = c.basePrice;
    prices[c.key] = i === hotIndex ? Math.floor(base * 2) : Math.floor(base * (0.7 + rand() * 0.6));
  });
  return prices;
}

export function getOrePrices(hourSeed = getMarketHourSeed()): Record<string, number> {
  const rand = seededRandom(hourSeed + 999);
  const prices: Record<string, number> = {};
  for (const ore of ORE_TYPES) {
    prices[ore.key] = Math.floor(ore.basePrice * (0.8 + rand() * 0.5));
  }
  return prices;
}

export function getHotCrop(hourSeed = getMarketHourSeed()): string {
  const prices = getCropPrices(hourSeed);
  return Object.entries(prices).sort((a, b) => b[1] - a[1])[0]?.[0] || 'corn';
}

export function marketResetsAt(now = Date.now()): string {
  const nextHour = (Math.floor(now / 3600000) + 1) * 3600000;
  return new Date(nextHour).toISOString();
}

export function dungeonResetsAt(now = Date.now()): string {
  const next = (Math.floor(now / 1800000) + 1) * 1800000;
  return new Date(next).toISOString();
}

export interface DungeonRoom {
  index: number;
  name: string;
  icon: string;
  enemyPower: number;
  lootRarity: Rarity;
}

export function generateDungeonRooms(seed: number, playerPower: number): DungeonRoom[] {
  const rand = seededRandom(seed);
  const roomCount = 3 + Math.floor(rand() * 3);
  const themes = ['Crypt', 'Cavern', 'Ruins', 'Vault', 'Nest', 'Arena'];
  const icons = ['💀', '🕳️', '🏚️', '🔒', '🕸️', '⚔️'];
  const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

  return Array.from({ length: roomCount }, (_, i) => {
    const t = Math.floor(rand() * themes.length);
    const powerScale = 0.5 + (i + 1) * 0.15 + rand() * 0.3;
    return {
      index: i,
      name: `${themes[t]} ${i + 1}`,
      icon: icons[t],
      enemyPower: Math.floor(playerPower * powerScale),
      lootRarity: rarities[Math.min(i, rarities.length - 1)],
    };
  });
}

export function rollOres(pickaxeTier: number, mineLevel: number, seed?: number): Record<string, number> {
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const roll = typeof rand === 'function' ? rand() : Math.random();
  const results: Record<string, number> = {};
  const attempts = 1 + Math.floor(mineLevel / 2);

  for (let a = 0; a < attempts; a++) {
    const r = typeof rand === 'function' ? rand() : Math.random();
    const available = ORE_TYPES.filter((o) => o.minPickaxe <= pickaxeTier);
    const ore = available[Math.floor(r * available.length)] || available[0];
    if (ore) {
      const qty = 1 + Math.floor((typeof rand === 'function' ? rand() : Math.random()) * mineLevel);
      results[ore.key] = (results[ore.key] || 0) + qty;
    }
  }
  return results;
}

export function defaultBuildingMeta(buildingKey: string): Record<string, unknown> {
  const cropKeys = ['farm', 'greenhouse'];
  return {
    upgrades: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
    crop: cropKeys.includes(buildingKey) ? 'corn' : undefined,
  };
}

export function upgradeSlotCost(buildingKey: string, slot: number, level: number): { gold: number; materials: number } {
  const base = 20 + slot * 10;
  return {
    gold: Math.floor(base * Math.pow(1.2, level)),
    materials: Math.floor(5 * slot * (level + 1)),
  };
}
