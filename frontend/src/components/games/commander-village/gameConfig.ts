export type Patron = 'rick' | 'enclave' | 'karlak';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

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

export function buildingCost(baseCost: number, growth: number, level: number): number {
  return Math.floor(baseCost * Math.pow(growth, level));
}

export const BUILDING_COSTS: Record<string, { base: number; growth: number }> = {
  farm: { base: 50, growth: 1.15 },
  mine: { base: 75, growth: 1.15 },
  market: { base: 100, growth: 1.18 },
  hq: { base: 200, growth: 1.2 },
};
