export type Patron = 'rick' | 'enclave' | 'karlak';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type SkillBranch = 'health' | 'damage' | 'shield';
export type PackType = 'standard' | 'faction' | 'premium' | 'weapon_pack' | 'armor_pack' | 'random_pack';

export const BUILDINGS: Record<string, { name: string; icon: string; resource: string }> = {
  farm: { name: 'Farm', icon: '🌾', resource: 'crop' },
  mine: { name: 'Mine', icon: '⛏️', resource: 'materials' },
  market: { name: 'Market', icon: '🏪', resource: 'gold' },
  hq: { name: 'Faction HQ', icon: '🏛️', resource: 'faction' },
  greenhouse: { name: 'Greenhouse', icon: '🪴', resource: 'crop' },
  lumber_mill: { name: 'Lumber Mill', icon: '🪵', resource: 'wood' },
  quarry: { name: 'Quarry', icon: '🪨', resource: 'stone' },
  smithy: { name: 'Smithy', icon: '🔨', resource: 'materials' },
  barracks: { name: 'Barracks', icon: '🛡️', resource: 'gold' },
  library: { name: 'Library', icon: '📚', resource: 'gold' },
  shrine: { name: 'Shrine', icon: '⛩️', resource: 'faction' },
  warehouse: { name: 'Warehouse', icon: '📦', resource: 'gold' },
  workshop: { name: 'Workshop', icon: '🔧', resource: 'materials' },
  tavern: { name: 'Tavern', icon: '🍺', resource: 'gold' },
};

export const BUILDING_COSTS: Record<string, { base: number; growth: number }> = {
  farm: { base: 50, growth: 1.15 },
  mine: { base: 75, growth: 1.15 },
  market: { base: 100, growth: 1.18 },
  hq: { base: 200, growth: 1.2 },
  greenhouse: { base: 80, growth: 1.16 },
  lumber_mill: { base: 70, growth: 1.14 },
  quarry: { base: 85, growth: 1.15 },
  smithy: { base: 120, growth: 1.18 },
  barracks: { base: 150, growth: 1.2 },
  library: { base: 110, growth: 1.17 },
  shrine: { base: 130, growth: 1.19 },
  warehouse: { base: 90, growth: 1.12 },
  workshop: { base: 100, growth: 1.16 },
  tavern: { base: 95, growth: 1.15 },
};

export const CROP_TYPES = [
  { key: 'corn', name: 'Corn', icon: '🌽', basePrice: 10 },
  { key: 'wheat', name: 'Wheat', icon: '🌾', basePrice: 8 },
  { key: 'pumpkin', name: 'Pumpkin', icon: '🎃', basePrice: 14 },
  { key: 'berries', name: 'Berries', icon: '🫐', basePrice: 12 },
  { key: 'mushrooms', name: 'Mushrooms', icon: '🍄', basePrice: 16 },
  { key: 'herbs', name: 'Herbs', icon: '🌿', basePrice: 11 },
];

export const ORE_TYPES = [
  { key: 'copper', name: 'Copper', icon: '🟤', basePrice: 5, minPickaxe: 1 },
  { key: 'iron', name: 'Iron', icon: '⚙️', basePrice: 12, minPickaxe: 1 },
  { key: 'gold', name: 'Gold Ore', icon: '🟡', basePrice: 25, minPickaxe: 2 },
  { key: 'crystal', name: 'Crystal', icon: '💎', basePrice: 45, minPickaxe: 3 },
  { key: 'mythril', name: 'Mythril', icon: '✨', basePrice: 80, minPickaxe: 4 },
];

export const COSMETIC_OPTIONS = {
  armor: ['default', 'leather', 'plate', 'shadow', 'power', 'arcane'],
  aura: ['none', 'green', 'blue', 'red', 'gold', 'void'],
  weapon: ['basic', 'sword', 'rifle', 'staff', 'portal_gun', 'hex_blade'],
  banner: ['standard', 'eagle', 'portal', 'skull', 'rune'],
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  mythic: '#ef4444',
};

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Grey',
  uncommon: 'Green',
  rare: 'Blue',
  epic: 'Purple',
  legendary: 'Yellow',
  mythic: 'Mythical',
};

export const PACK_TYPES: Record<PackType, { name: string; icon: string; cost: Record<string, number>; category: string; desc: string }> = {
  standard: { name: 'Troop Pack', icon: '📦', cost: { gold: 100 }, category: 'troop', desc: 'Pull a random troop — Grey to Mythical' },
  faction: { name: 'Faction Pack', icon: '🏛️', cost: { faction_currency: 50 }, category: 'troop', desc: 'Faction-themed elite troops' },
  premium: { name: 'Elite Troop Pack', icon: '💎', cost: { materials: 75 }, category: 'troop', desc: 'Better odds for rare troops' },
  weapon_pack: { name: 'Weapon Pack', icon: '⚔️', cost: { gold: 80 }, category: 'weapon', desc: 'RNG weapons & combat gear' },
  armor_pack: { name: 'Armor Pack', icon: '🛡️', cost: { gold: 80 }, category: 'armor', desc: 'RNG armor pieces & shields' },
  random_pack: { name: 'Mystery Pack', icon: '🎲', cost: { gold: 150 }, category: 'mixed', desc: '35% troop · 65% gear — trade or equip' },
};

export const SKILL_BRANCHES: SkillBranch[] = ['health', 'damage', 'shield'];

export const SKILL_NODE_BONUS: Record<SkillBranch, number> = {
  health: 8,
  damage: 5,
  shield: 4,
};

export function skillNodeCost(branch: SkillBranch, node: number): { gold: number; materials: number } {
  const base = branch === 'health' ? 15 : branch === 'damage' ? 20 : 18;
  return { gold: Math.floor(base * Math.pow(1.25, node - 1)), materials: Math.floor(8 * node) };
}

export function buildingCost(baseCost: number, growth: number, level: number): number {
  return Math.floor(baseCost * Math.pow(growth, level));
}

export function normalizeCombatStats(stats: Record<string, unknown>): {
  health: number; damage: number; shield: number; skill_nodes: string[];
} {
  if (stats.health !== undefined) {
    return {
      health: Number(stats.health),
      damage: Number(stats.damage ?? stats.atk ?? 5),
      shield: Number(stats.shield ?? Math.floor(Number(stats.def ?? 3) / 2) + 2),
      skill_nodes: Array.isArray(stats.skill_nodes) ? stats.skill_nodes as string[] : [],
    };
  }
  const atk = Number(stats.atk ?? 5);
  const def = Number(stats.def ?? 3);
  return { health: def * 10, damage: atk, shield: Math.floor(def / 2) + 2, skill_nodes: [] };
}

export const COMMANDER_SKILL_BRANCHES = ['economy', 'army', 'world'] as const;
export type CommanderSkillBranch = typeof COMMANDER_SKILL_BRANCHES[number];

export const COMMANDER_SKILLS = [
  { key: 'farm_boost', branch: 'economy' as const, node: 1, name: 'Farm Yield', cost: 1, desc: '+5% farm & crop output' },
  { key: 'mine_boost', branch: 'economy' as const, node: 2, name: 'Mine Yield', cost: 1, desc: '+5% mine & ore rolls' },
  { key: 'market_bonus', branch: 'economy' as const, node: 3, name: 'Market Bonus', cost: 2, desc: '+8% sell prices' },
  { key: 'crop_speed', branch: 'economy' as const, node: 4, name: 'Fast Crops', cost: 2, desc: '+10% crop production speed' },
  { key: 'trade_master', branch: 'economy' as const, node: 5, name: 'Trade Master', cost: 3, desc: '+15% trade & gift value' },
  { key: 'recruit_cheap', branch: 'army' as const, node: 1, name: 'Recruitment', cost: 1, desc: '-10% troop recruit cost' },
  { key: 'troop_stats', branch: 'army' as const, node: 2, name: 'Training', cost: 1, desc: '+3% all troop stats' },
  { key: 'pack_pity', branch: 'army' as const, node: 3, name: 'Pack Pity', cost: 2, desc: 'Faster rare pack pulls' },
  { key: 'duel_luck', branch: 'army' as const, node: 4, name: 'Duel Luck', cost: 2, desc: '+10% duel win odds' },
  { key: 'army_cap', branch: 'army' as const, node: 5, name: 'Elite Army', cost: 3, desc: '+1 max army slot' },
  { key: 'grid_discount', branch: 'world' as const, node: 1, name: 'Land Survey', cost: 1, desc: '-10% grid expand cost' },
  { key: 'zone_yield', branch: 'world' as const, node: 2, name: 'Zone Harvest', cost: 1, desc: '+10% zone capture yield' },
  { key: 'patrol_boost', branch: 'world' as const, node: 3, name: 'Patrol Veteran', cost: 2, desc: '+1 patrol loot roll' },
  { key: 'dungeon_boost', branch: 'world' as const, node: 4, name: 'Dungeon Delver', cost: 2, desc: '+10% dungeon loot' },
  { key: 'scout_range', branch: 'world' as const, node: 5, name: 'Scout Network', cost: 3, desc: 'See zone enemy power hints' },
];

export const ZONE_TYPES: Record<string, { name: string; icon: string; yield: Record<string, number> }> = {
  farm: { name: 'Farmland', icon: '🌾', yield: { food: 15 } },
  mine: { name: 'Ore Vein', icon: '⛏️', yield: { materials: 12 } },
  market: { name: 'Trade Post', icon: '🏪', yield: { gold: 20 } },
  ruins: { name: 'Ancient Ruins', icon: '🏚️', yield: { faction_currency: 8 } },
  fortress: { name: 'Fortress', icon: '🏰', yield: { gold: 10, materials: 10 } },
};

export function xpToLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export interface LootItemDef {
  id: string;
  name: string;
  rarity: Rarity;
  sellValue: number;
  stats: Record<string, number>;
  description: string;
  item_type: string;
  use_hint: string;
}

export function getEquipSlotForItem(itemId: string, items: LootItemDef[]): 'weapon' | 'armor' | 'relic' {
  const def = items.find((i) => i.id === itemId);
  if (!def) return 'weapon';
  if (def.item_type === 'armor') return 'armor';
  if (def.item_type === 'relic') return 'relic';
  return 'weapon';
}

export function canEquipOnCommander(itemId: string, items: LootItemDef[]): boolean {
  const def = items.find((i) => i.id === itemId);
  return def?.item_type === 'armor' || def?.item_type === 'weapon' || def?.item_type === 'relic';
}

export function itemSellPrice(itemId: string, rarity: string, items?: LootItemDef[]): number {
  const def = items?.find((i) => i.id === itemId);
  if (def) return def.sellValue;
  const fallback: Record<string, number> = {
    common: 5, uncommon: 25, rare: 75, epic: 200, legendary: 500, mythic: 2000,
  };
  return fallback[rarity] || 5;
}

export function getUnlockedCrops(upgradeLevels: Record<string, number>): string[] {
  const slot3 = upgradeLevels['3'] || 0;
  const base = ['corn', 'wheat'];
  if (slot3 >= 1) base.push('pumpkin', 'berries');
  if (slot3 >= 2) base.push('mushrooms', 'herbs');
  return base;
}
