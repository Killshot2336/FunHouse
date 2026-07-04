/** Commander skill bonuses derived from profile_progress.sp_spent_json */

export interface CommanderBonuses {
  farmYield: number;
  mineYield: number;
  marketSell: number;
  cropSpeed: number;
  tradeValue: number;
  recruitDiscount: number;
  troopStats: number;
  pityRareAt: number;
  pityLegendaryAt: number;
  duelLuck: number;
  armyCapBonus: number;
  gridDiscount: number;
  zoneYield: number;
  patrolExtraRolls: number;
  dungeonLoot: number;
  scoutRange: boolean;
}

export const DEFAULT_BONUSES: CommanderBonuses = {
  farmYield: 1,
  mineYield: 1,
  marketSell: 1,
  cropSpeed: 1,
  tradeValue: 1,
  recruitDiscount: 1,
  troopStats: 1,
  pityRareAt: 40,
  pityLegendaryAt: 300,
  duelLuck: 1,
  armyCapBonus: 0,
  gridDiscount: 1,
  zoneYield: 1,
  patrolExtraRolls: 0,
  dungeonLoot: 1,
  scoutRange: false,
};

export function getCommanderBonuses(spent: string[]): CommanderBonuses {
  const s = new Set(spent);
  return {
    farmYield: s.has('farm_boost') ? 1.05 : 1,
    mineYield: s.has('mine_boost') ? 1.05 : 1,
    marketSell: s.has('market_bonus') ? 1.08 : 1,
    cropSpeed: s.has('crop_speed') ? 1.1 : 1,
    tradeValue: s.has('trade_master') ? 1.15 : 1,
    recruitDiscount: s.has('recruit_cheap') ? 0.9 : 1,
    troopStats: s.has('troop_stats') ? 1.03 : 1,
    pityRareAt: s.has('pack_pity') ? 35 : 40,
    pityLegendaryAt: s.has('pack_pity') ? 270 : 300,
    duelLuck: s.has('duel_luck') ? 1.1 : 1,
    armyCapBonus: s.has('army_cap') ? 1 : 0,
    gridDiscount: s.has('grid_discount') ? 0.9 : 1,
    zoneYield: s.has('zone_yield') ? 1.1 : 1,
    patrolExtraRolls: s.has('patrol_boost') ? 1 : 0,
    dungeonLoot: s.has('dungeon_boost') ? 1.1 : 1,
    scoutRange: s.has('scout_range'),
  };
}

export function maxArmySlots(bonuses: CommanderBonuses, barracksEliteGuard = false): number {
  return 6 + bonuses.armyCapBonus + (barracksEliteGuard ? 1 : 0);
}

export function scaleResourceMap(obj: Record<string, number>, mult: number): Record<string, number> {
  if (mult === 1) return obj;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Math.max(0, Math.floor(v * mult));
  }
  return out;
}

export function scaleOreMap(ores: Record<string, number>, mult: number): Record<string, number> {
  if (mult === 1) return ores;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(ores)) {
    out[k] = Math.max(0, Math.floor(v * mult));
  }
  return out;
}

export function scaleItemStats(stats: Record<string, number>, mult: number): Record<string, number> {
  if (mult === 1) return stats;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(stats)) {
    out[k] = Math.max(1, Math.floor(v * mult));
  }
  return out;
}
