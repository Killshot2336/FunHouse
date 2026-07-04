export type Patron = 'rick' | 'enclave' | 'karlak';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type SkillBranch = 'health' | 'damage' | 'shield';
export type PackType = 'standard' | 'faction' | 'premium';

export const BUILDINGS: Record<string, { name: string; icon: string; resource: string }> = {
  farm: { name: 'Farm', icon: '🌾', resource: 'food' },
  mine: { name: 'Mine', icon: '⛏️', resource: 'materials' },
  market: { name: 'Market', icon: '🏪', resource: 'gold' },
  hq: { name: 'Faction HQ', icon: '🏛️', resource: 'faction' },
};

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

export const PACK_TYPES: Record<PackType, { name: string; icon: string; cost: Record<string, number> }> = {
  standard: { name: 'Standard Pack', icon: '📦', cost: { gold: 100 } },
  faction: { name: 'Faction Pack', icon: '🏛️', cost: { faction_currency: 50 } },
  premium: { name: 'Premium Pack', icon: '💎', cost: { materials: 75 } },
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

export const BUILDING_COSTS: Record<string, { base: number; growth: number }> = {
  farm: { base: 50, growth: 1.15 },
  mine: { base: 75, growth: 1.15 },
  market: { base: 100, growth: 1.18 },
  hq: { base: 200, growth: 1.2 },
};

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

export const COMMANDER_SKILLS = [
  { key: 'farm_boost', name: '+5% Farm Yield', cost: 1, desc: 'Farms produce more food' },
  { key: 'mine_boost', name: '+5% Mine Yield', cost: 1, desc: 'Mines produce more materials' },
  { key: 'duel_luck', name: '+10% Duel Luck', cost: 2, desc: 'Better odds in duels' },
  { key: 'pack_pity', name: '+1 Pack Pity', cost: 2, desc: 'Faster rare pulls' },
  { key: 'grid_discount', name: 'Grid Expand -10%', cost: 3, desc: 'Cheaper territory expansion' },
] as const;

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
