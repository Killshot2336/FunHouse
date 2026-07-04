export type Patron = 'rick' | 'enclave' | 'karlak';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export const PATRON_BY_USER: Record<string, Patron> = {
  aden: 'rick',
  edward: 'enclave',
  jamie: 'karlak',
};

export const PATRON_BY_THEME: Record<string, Patron> = {
  morty: 'rick',
  enclave: 'enclave',
  warlock: 'karlak',
};

export const BUILDINGS = {
  farm: { name: 'Farm', icon: '🌾', resource: 'food', baseRate: 1, baseCost: 50, growth: 1.15 },
  mine: { name: 'Mine', icon: '⛏️', resource: 'materials', baseRate: 0.8, baseCost: 75, growth: 1.15 },
  market: { name: 'Market', icon: '🏪', resource: 'gold', baseRate: 2, baseCost: 100, growth: 1.18 },
  hq: { name: 'Faction HQ', icon: '🏛️', resource: 'faction', baseRate: 0.5, baseCost: 200, growth: 1.2 },
} as const;

export const UNITS_BY_PATRON: Record<Patron, Array<{ key: string; name: string; icon: string; baseCost: number }>> = {
  rick: [
    { key: 'portal_trooper', name: 'Portal Trooper', icon: '🌀', baseCost: 100 },
    { key: 'meeseeks', name: 'Meeseeks Worker', icon: '🔵', baseCost: 80 },
    { key: 'cronenberg', name: 'Cronenberg Brute', icon: '🧬', baseCost: 150 },
    { key: 'plumbus_eng', name: 'Plumbus Engineer', icon: '🔧', baseCost: 120 },
    { key: 'scout', name: 'Interdimensional Scout', icon: '👁️', baseCost: 90 },
  ],
  enclave: [
    { key: 'soldier', name: 'Enclave Soldier', icon: '🪖', baseCost: 100 },
    { key: 'power_armor', name: 'Power Armor Unit', icon: '🤖', baseCost: 200 },
    { key: 'vertibird', name: 'Vertibird Pilot', icon: '🚁', baseCost: 150 },
    { key: 'scientist', name: 'Science Officer', icon: '🔬', baseCost: 120 },
    { key: 'gunner', name: 'Heavy Gunner', icon: '💣', baseCost: 180 },
  ],
  karlak: [
    { key: 'acolyte', name: 'Shadow Acolyte', icon: '🌑', baseCost: 100 },
    { key: 'blood_knight', name: 'Blood Knight', icon: '🩸', baseCost: 150 },
    { key: 'rune_weaver', name: 'Rune Weaver', icon: '᚛', baseCost: 120 },
    { key: 'champion', name: "Patron's Champion", icon: '👑', baseCost: 250 },
    { key: 'hexblade', name: 'Hexblade', icon: '⚔️', baseCost: 180 },
  ],
};

export const LOOT_TABLE: Array<{ id: string; name: string; rarity: Rarity; sellValue: number; stats: Record<string, number> }> = [
  { id: 'scrap', name: 'Scrap Metal', rarity: 'common', sellValue: 5, stats: {} },
  { id: 'basic_gear', name: 'Basic Gear', rarity: 'common', sellValue: 10, stats: { atk: 1 } },
  { id: 'food_crate', name: 'Food Crate', rarity: 'common', sellValue: 8, stats: {} },
  { id: 'unit_shard', name: 'Unit Shard', rarity: 'uncommon', sellValue: 25, stats: { atk: 3 } },
  { id: 'blueprint', name: 'Building Blueprint', rarity: 'uncommon', sellValue: 30, stats: {} },
  { id: 'named_weapon', name: 'Named Weapon', rarity: 'rare', sellValue: 75, stats: { atk: 8, spd: 2 } },
  { id: 'rare_unlock', name: 'Rare Unit Unlock', rarity: 'rare', sellValue: 100, stats: { atk: 5, def: 5 } },
  { id: 'set_piece', name: 'Set Armor Piece', rarity: 'epic', sellValue: 200, stats: { atk: 12, def: 10 } },
  { id: 'relic', name: 'Unique Relic', rarity: 'legendary', sellValue: 500, stats: { atk: 20, def: 15, luck: 10 } },
  { id: 'mega_unlock', name: 'Mega Building Unlock', rarity: 'legendary', sellValue: 750, stats: {} },
  { id: 'patron_artifact', name: 'Patron Artifact', rarity: 'mythic', sellValue: 2000, stats: { atk: 30, def: 25, spd: 15, luck: 20 } },
  { id: 'cross_exotic', name: 'Cross-Faction Exotic', rarity: 'mythic', sellValue: 3000, stats: { atk: 25, def: 20, luck: 25 } },
];

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 55,
  uncommon: 25,
  rare: 12,
  epic: 6,
  legendary: 1.8,
  mythic: 0.2,
};

export const MISSIONS = [
  { key: 'recruit_2', name: 'Recruit 2 Soldiers', type: 'recruit', target: 2, reward: { gold: 50, materials: 20 } },
  { key: 'upgrade_farm', name: 'Upgrade Farm to Lv 3', type: 'building', target: 3, building: 'farm', reward: { gold: 75, materials: 30 } },
  { key: 'patrol_1', name: 'Complete 1 Patrol', type: 'patrol', target: 1, reward: { gold: 100, materials: 50 } },
  { key: 'build_3', name: 'Place 3 Buildings', type: 'build', target: 3, reward: { gold: 60, materials: 40 } },
  { key: 'upgrade_unit', name: 'Upgrade a Unit Stat', type: 'upgrade', target: 1, reward: { gold: 80, materials: 25 } },
];

export const STORY_INTROS: Record<Patron, { title: string; text: string }> = {
  rick: {
    title: 'PORTAL OUTPOST DIRECTIVE',
    text: "Listen Morty — *burp* — I found a microverse worth exploiting. You're running the portal outpost while I do ACTUAL science. Recruit weirdos, farm scrap, don't die. It's not rocket surgery.",
  },
  enclave: {
    title: 'ENCLAVE FORWARD OPERATING BASE',
    text: 'Operative, High Command has authorized your forward operating base. The restoration of the American way of life depends on systematic village expansion and mission completion. Your objectives are logged. Execute.',
  },
  karlak: {
    title: 'SANCTUM VILLAGE DECREE',
    text: 'My dear vessel... I demand a sanctum village to channel my power. Build my domain. Shape your warband. Each stone you place, each soul you forge, brings you closer to true strength — and my favor.',
  },
};

export function buildingCost(key: string, level: number): number {
  const b = BUILDINGS[key as keyof typeof BUILDINGS];
  if (!b) return 999999;
  return Math.floor(b.baseCost * Math.pow(b.growth, level));
}

export function buildingRate(key: string, level: number): number {
  const b = BUILDINGS[key as keyof typeof BUILDINGS];
  if (!b) return 0;
  return b.baseRate * level;
}

export function statUpgradeCost(level: number): number {
  return Math.floor(10 * Math.pow(1.12, level));
}

export function calcPowerRating(units: Array<{ stats: Record<string, unknown> }>, villageLevel: number): number {
  const unitPower = units.reduce((sum, u) => {
    const s = normalizeCombatStats(u.stats);
    return sum + s.damage + s.shield + Math.floor(s.health / 10);
  }, 0);
  return Math.floor(unitPower + villageLevel * 10);
}

export const RARITY_STAT_MULT: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.2,
  rare: 1.5,
  epic: 2,
  legendary: 2.5,
  mythic: 3,
};

export const PACK_TYPES = {
  standard: { name: 'Standard Pack', icon: '📦', cost: { gold: 100 } },
  faction: { name: 'Faction Pack', icon: '🏛️', cost: { faction_currency: 50 } },
  premium: { name: 'Premium Pack', icon: '💎', cost: { materials: 75 } },
} as const;

export type PackType = keyof typeof PACK_TYPES;

export const SKILL_BRANCHES = ['health', 'damage', 'shield'] as const;
export type SkillBranch = typeof SKILL_BRANCHES[number];

export const SKILL_NODE_BONUS: Record<SkillBranch, number> = {
  health: 8,
  damage: 5,
  shield: 4,
};

export function skillNodeCost(branch: SkillBranch, node: number): { gold: number; materials: number } {
  const base = branch === 'health' ? 15 : branch === 'damage' ? 20 : 18;
  return { gold: Math.floor(base * Math.pow(1.25, node - 1)), materials: Math.floor(8 * node) };
}

export function normalizeCombatStats(stats: Record<string, unknown>): { health: number; damage: number; shield: number; skill_nodes: string[] } {
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
  return {
    health: def * 10,
    damage: atk,
    shield: Math.floor(def / 2) + 2,
    skill_nodes: [],
  };
}

export function defaultCombatStats(rarity: Rarity = 'common'): { health: number; damage: number; shield: number; skill_nodes: string[] } {
  const mult = RARITY_STAT_MULT[rarity];
  return {
    health: Math.floor(50 * mult),
    damage: Math.floor(10 * mult),
    shield: Math.floor(8 * mult),
    skill_nodes: [],
  };
}

export const COMMANDER_SKILLS = [
  { key: 'farm_boost', name: '+5% Farm Yield', cost: 1, desc: 'Farms produce more food' },
  { key: 'mine_boost', name: '+5% Mine Yield', cost: 1, desc: 'Mines produce more materials' },
  { key: 'duel_luck', name: '+10% Duel Luck', cost: 1, desc: 'Better odds in duels' },
  { key: 'pack_pity', name: '+1 Pack Pity', cost: 2, desc: 'Faster rare pulls' },
  { key: 'grid_discount', name: 'Grid Expand -10%', cost: 2, desc: 'Cheaper territory expansion' },
] as const;

export const ZONE_TYPES: Record<string, { name: string; icon: string; yield: Record<string, number> }> = {
  farm: { name: 'Farmland', icon: '🌾', yield: { food: 15 } },
  mine: { name: 'Ore Vein', icon: '⛏️', yield: { materials: 12 } },
  market: { name: 'Trade Post', icon: '🏪', yield: { gold: 20 } },
  ruins: { name: 'Ancient Ruins', icon: '🏚️', yield: { faction_currency: 8 } },
  fortress: { name: 'Fortress', icon: '🏰', yield: { gold: 10, materials: 10 } },
};

export function expandGridCost(gridSize: number): number {
  return Math.floor(500 * Math.pow(1.5, gridSize - 8));
}
