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
  greenhouse: { name: 'Greenhouse', icon: '🪴', resource: 'crop', baseRate: 1.2, baseCost: 80, growth: 1.16 },
  lumber_mill: { name: 'Lumber Mill', icon: '🪵', resource: 'wood', baseRate: 0.9, baseCost: 70, growth: 1.14 },
  quarry: { name: 'Quarry', icon: '🪨', resource: 'stone', baseRate: 0.7, baseCost: 85, growth: 1.15 },
  smithy: { name: 'Smithy', icon: '🔨', resource: 'materials', baseRate: 0.5, baseCost: 120, growth: 1.18 },
  barracks: { name: 'Barracks', icon: '🛡️', resource: 'gold', baseRate: 0.3, baseCost: 150, growth: 1.2 },
  library: { name: 'Library', icon: '📚', resource: 'gold', baseRate: 0.4, baseCost: 110, growth: 1.17 },
  shrine: { name: 'Shrine', icon: '⛩️', resource: 'faction', baseRate: 0.6, baseCost: 130, growth: 1.19 },
  warehouse: { name: 'Warehouse', icon: '📦', resource: 'gold', baseRate: 0.2, baseCost: 90, growth: 1.12 },
  workshop: { name: 'Workshop', icon: '🔧', resource: 'materials', baseRate: 0.6, baseCost: 100, growth: 1.16 },
  tavern: { name: 'Tavern', icon: '🍺', resource: 'gold', baseRate: 0.5, baseCost: 95, growth: 1.15 },
} as const;

export const CROP_TYPES = [
  { key: 'corn', name: 'Corn', icon: '🌽', basePrice: 10 },
  { key: 'wheat', name: 'Wheat', icon: '🌾', basePrice: 8 },
  { key: 'pumpkin', name: 'Pumpkin', icon: '🎃', basePrice: 14 },
  { key: 'berries', name: 'Berries', icon: '🫐', basePrice: 12 },
  { key: 'mushrooms', name: 'Mushrooms', icon: '🍄', basePrice: 16 },
  { key: 'herbs', name: 'Herbs', icon: '🌿', basePrice: 11 },
] as const;

export const ORE_TYPES = [
  { key: 'copper', name: 'Copper', icon: '🟤', basePrice: 5, minPickaxe: 1 },
  { key: 'iron', name: 'Iron', icon: '⚙️', basePrice: 12, minPickaxe: 1 },
  { key: 'gold', name: 'Gold Ore', icon: '🟡', basePrice: 25, minPickaxe: 2 },
  { key: 'crystal', name: 'Crystal', icon: '💎', basePrice: 45, minPickaxe: 3 },
  { key: 'mythril', name: 'Mythril', icon: '✨', basePrice: 80, minPickaxe: 4 },
] as const;

export const BUILDING_UPGRADE_TREES: Record<string, Array<{ slot: number; name: string; desc: string }>> = {
  farm: [
    { slot: 1, name: 'Yield Boost', desc: '+10% crop yield per level' },
    { slot: 2, name: 'Growth Speed', desc: '+8% production speed per level' },
    { slot: 3, name: 'Crop Slot', desc: 'Unlock additional crop types' },
    { slot: 4, name: 'Market Bonus', desc: '+5% sell price for crops' },
    { slot: 5, name: 'Auto-Harvest', desc: 'Auto-collect crops on login' },
  ],
  greenhouse: [
    { slot: 1, name: 'Climate Control', desc: '+12% greenhouse yield' },
    { slot: 2, name: 'Irrigation', desc: '+10% production speed' },
    { slot: 3, name: 'Rare Crops', desc: 'Unlock premium crop types' },
    { slot: 4, name: 'Storage Racks', desc: '+20% crop storage cap' },
    { slot: 5, name: 'Green Thumb', desc: 'Double yield on hot crop hour' },
  ],
  mine: [
    { slot: 1, name: 'Deep Shaft', desc: '+10% ore rolls per level' },
    { slot: 2, name: 'Ventilation', desc: 'Faster mine cooldown' },
    { slot: 3, name: 'Ore Scanner', desc: 'Reveal ore quality before collect' },
    { slot: 4, name: 'Reinforced Walls', desc: '+15% rare ore chance' },
    { slot: 5, name: 'Night Shift', desc: 'Bonus collect while offline' },
  ],
  market: [
    { slot: 1, name: 'Trade Routes', desc: '+8% gold income' },
    { slot: 2, name: 'Bulk Deals', desc: 'Sell 10% more per transaction' },
    { slot: 3, name: 'Price Intel', desc: 'See next hour crop prices' },
    { slot: 4, name: 'Merchant Guild', desc: '+5% all sell prices' },
    { slot: 5, name: 'Auction House', desc: 'Unlock bulk sell all' },
  ],
  hq: [
    { slot: 1, name: 'Command Center', desc: '+5% all building rates' },
    { slot: 2, name: 'Faction Banner', desc: '+10% faction currency' },
    { slot: 3, name: 'War Room', desc: '+3% troop power' },
    { slot: 4, name: 'Diplomacy', desc: 'Better trade offers' },
    { slot: 5, name: 'Grand HQ', desc: '+1 village level cap' },
  ],
  lumber_mill: [
    { slot: 1, name: 'Saw Blades', desc: '+10% wood per level' },
    { slot: 2, name: 'Log Transport', desc: 'Faster wood production' },
    { slot: 3, name: 'Forestry', desc: 'Unlock rare wood types' },
    { slot: 4, name: 'Efficiency', desc: '-10% upgrade costs' },
    { slot: 5, name: 'Mass Production', desc: 'Double wood on collect' },
  ],
  quarry: [
    { slot: 1, name: 'Blast Mining', desc: '+10% stone yield' },
    { slot: 2, name: 'Dynamite', desc: 'Faster stone production' },
    { slot: 3, name: 'Gem Finder', desc: 'Chance for bonus materials' },
    { slot: 4, name: 'Reinforcement', desc: 'Stone used in cheaper upgrades' },
    { slot: 5, name: 'Deep Quarry', desc: 'Unlock mythril processing' },
  ],
  smithy: [
    { slot: 1, name: 'Forge Heat', desc: '+1 pickaxe tier unlock' },
    { slot: 2, name: 'Tempering', desc: 'Better ore processing yield' },
    { slot: 3, name: 'Tool Craft', desc: 'Craft basic gear from ores' },
    { slot: 4, name: 'Master Smith', desc: '+15% equipment stats' },
    { slot: 5, name: 'Legendary Forge', desc: 'Max pickaxe tier 5' },
  ],
  barracks: [
    { slot: 1, name: 'Recruitment', desc: '+1 troop cap per 5 levels' },
    { slot: 2, name: 'Training Grounds', desc: '+5% unit XP gain' },
    { slot: 3, name: 'Armory', desc: 'Cheaper unit recruitment' },
    { slot: 4, name: 'Veterans', desc: '+3% all unit stats' },
    { slot: 5, name: 'Elite Guard', desc: '+1 max army slot' },
  ],
  library: [
    { slot: 1, name: 'Study Hall', desc: '+5% commander XP' },
    { slot: 2, name: 'Tactics', desc: '+3% patrol loot' },
    { slot: 3, name: 'Lore', desc: 'Unlock guide entries' },
    { slot: 4, name: 'Research', desc: '+10% skill point gain' },
    { slot: 5, name: 'Grand Library', desc: 'Double commander XP from missions' },
  ],
  shrine: [
    { slot: 1, name: 'Offerings', desc: '+8% faction currency' },
    { slot: 2, name: 'Blessing', desc: '+5% luck on loot rolls' },
    { slot: 3, name: 'Ritual', desc: 'Bonus faction from duels' },
    { slot: 4, name: 'Patron Favor', desc: '+10% pack rare rate' },
    { slot: 5, name: 'Divine Shrine', desc: 'Mythic pity -10 rolls' },
  ],
  warehouse: [
    { slot: 1, name: 'Storage', desc: '+20% stockpile cap' },
    { slot: 2, name: 'Organization', desc: 'See all stockpile at glance' },
    { slot: 3, name: 'Preservation', desc: 'Crops don\'t spoil offline' },
    { slot: 4, name: 'Trade Hub', desc: '+10% sell cap' },
    { slot: 5, name: 'Mega Warehouse', desc: 'Unlimited crop storage' },
  ],
  workshop: [
    { slot: 1, name: 'Workbench', desc: 'Craft from 1 ore type' },
    { slot: 2, name: 'Blueprints', desc: 'Unlock rare recipes' },
    { slot: 3, name: 'Assembly Line', desc: '+15% craft yield' },
    { slot: 4, name: 'Quality Control', desc: 'Better crafted item stats' },
    { slot: 5, name: 'Master Workshop', desc: 'Craft epic gear' },
  ],
  tavern: [
    { slot: 1, name: 'Recruitment Board', desc: 'See dungeon preview' },
    { slot: 2, name: 'Ale & Rest', desc: '+5% dungeon loot' },
    { slot: 3, name: 'Party Buffs', desc: 'Troops +5% in dungeon' },
    { slot: 4, name: 'Bard\'s Tale', desc: 'Extra dungeon room chance' },
    { slot: 5, name: 'Hero\'s Rest', desc: 'One free dungeon retry per seed' },
  ],
};

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

export const LOOT_TABLE: LootItemDef[] = [
  { id: 'scrap', name: 'Scrap Metal', rarity: 'common', sellValue: 5, stats: {}, description: 'Salvaged metal from patrols and ruins.', item_type: 'material', use_hint: 'Sell at Market for gold' },
  { id: 'basic_gear', name: 'Basic Gear', rarity: 'common', sellValue: 10, stats: { atk: 1 }, description: 'Standard-issue equipment for new recruits.', item_type: 'weapon', use_hint: 'Equip on troop for +ATK' },
  { id: 'food_crate', name: 'Food Crate', rarity: 'common', sellValue: 8, stats: {}, description: 'Preserved rations for your village.', item_type: 'consumable', use_hint: 'Sell at Market or trade' },
  { id: 'unit_shard', name: 'Unit Shard', rarity: 'uncommon', sellValue: 25, stats: { atk: 3 }, description: 'Crystallized essence of a fallen warrior.', item_type: 'shard', use_hint: 'Equip on troop for +ATK' },
  { id: 'blueprint', name: 'Building Blueprint', rarity: 'uncommon', sellValue: 30, stats: {}, description: 'Architectural plans for village expansion.', item_type: 'blueprint', use_hint: 'Used in building upgrades' },
  { id: 'named_weapon', name: 'Named Weapon', rarity: 'rare', sellValue: 75, stats: { atk: 8, spd: 2 }, description: 'A weapon with a storied battle history.', item_type: 'weapon', use_hint: 'Equip on troop for +ATK and +SPD' },
  { id: 'rare_unlock', name: 'Rare Unit Unlock', rarity: 'rare', sellValue: 100, stats: { atk: 5, def: 5 }, description: 'Unlocks a rare troop variant.', item_type: 'unlock', use_hint: 'Recruit special units from Army tab' },
  { id: 'set_piece', name: 'Set Armor Piece', rarity: 'epic', sellValue: 200, stats: { atk: 12, def: 10 }, description: 'Part of a matched armor set.', item_type: 'armor', use_hint: 'Equip on troop for +ATK and +DEF' },
  { id: 'relic', name: 'Unique Relic', rarity: 'legendary', sellValue: 500, stats: { atk: 20, def: 15, luck: 10 }, description: 'An ancient artifact of immense power.', item_type: 'relic', use_hint: 'Equip in relic slot for massive bonuses' },
  { id: 'mega_unlock', name: 'Mega Building Unlock', rarity: 'legendary', sellValue: 750, stats: {}, description: 'Unlocks a premium building type.', item_type: 'unlock', use_hint: 'Place new building types in Village' },
  { id: 'patron_artifact', name: 'Patron Artifact', rarity: 'mythic', sellValue: 2000, stats: { atk: 30, def: 25, spd: 15, luck: 20 }, description: 'A divine gift from your patron.', item_type: 'relic', use_hint: 'Equip in relic slot — faction ultimate' },
  { id: 'cross_exotic', name: 'Cross-Faction Exotic', rarity: 'mythic', sellValue: 3000, stats: { atk: 25, def: 20, luck: 25 }, description: 'Forbidden tech from another dimension.', item_type: 'weapon', use_hint: 'Equip on troop or sell for premium gold' },
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

export const GAME_GUIDE = [
  {
    key: 'getting_started',
    title: 'Getting Started',
    content: 'Tap your identity to enter Commander Village. Build farms and mines on the village grid, recruit troops in Army, and send Patrols for loot. Resources auto-collect when you return.',
  },
  {
    key: 'buildings',
    title: 'Buildings',
    content: 'Place 14 building types on your village grid. Each has 5 unique upgrade slots — open a building panel to upgrade individual slots. Higher levels and upgrades boost production rates.',
  },
  {
    key: 'crops_market',
    title: 'Crops & Market',
    content: 'Farms and Greenhouses grow a crop you choose. Crop prices rotate every hour — one crop is "hot" at 2× price. Sell crops and ores at the Market tab. Watch the countdown for the next price shift.',
  },
  {
    key: 'mining',
    title: 'Mining & Ores',
    content: 'Upgrade your pickaxe at the Smithy (no ore prerequisites). Tap Collect on a Mine to roll ores based on pickaxe tier. Higher tiers unlock rarer ores like Crystal and Mythril.',
  },
  {
    key: 'army',
    title: 'Army & Packs',
    content: 'Recruit up to 6 troops. Upgrade stats and skill trees on each TroopCard. Open packs for rare units. Rarity colors: Grey, Green, Blue, Purple, Yellow, Mythical.',
  },
  {
    key: 'world_dungeon',
    title: 'World & Dungeon',
    content: 'Deploy troops on the 12×12 world map to capture zones. The Dungeon rotates every 30 minutes with new rooms and loot. Patrol is a quick 30-second loot run; Dungeon is the big event.',
  },
  {
    key: 'duels_trade',
    title: 'Duels & Trade',
    content: 'Challenge housemates to 1v1 duels with random resource stakes. Use Trade to swap gold, materials, food, and items with icons.',
  },
] as const;

export const BUILDING_KEYS = Object.keys(BUILDINGS);

export function isValidBuildingKey(key: string): boolean {
  return key in BUILDINGS;
}

export function getUnlockedCrops(upgradeLevels: Record<string, number>): string[] {
  const slot3 = upgradeLevels['3'] || 0;
  const base = ['corn', 'wheat'];
  if (slot3 >= 1) base.push('pumpkin', 'berries');
  if (slot3 >= 2) base.push('mushrooms', 'herbs');
  return base;
}

export function getPickaxeTier(smithyUpgrades: Record<string, number>, commanderTier: number): number {
  const forgeLevel = smithyUpgrades['1'] || 0;
  const legendaryForge = smithyUpgrades['5'] || 0;
  return Math.min(5, Math.max(commanderTier, 1 + forgeLevel + (legendaryForge >= 1 ? 1 : 0)));
}
