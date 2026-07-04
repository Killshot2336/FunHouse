export interface ProfileProgress {
  user_id: string;
  xp: number;
  level: number;
  sp_unspent: number;
  sp_spent_json: string[];
}

export function xpToLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpToLevel(i);
  return total;
}

export function addXp(progress: ProfileProgress, amount: number): ProfileProgress {
  const next = { ...progress, xp: progress.xp + amount };
  while (next.xp >= totalXpForLevel(next.level + 1)) {
    next.level += 1;
    next.sp_unspent += 1;
  }
  return next;
}

export const XP_AWARDS: Record<string, number> = {
  chore: 15,
  cat_care: 10,
  build: 10,
  recruit: 15,
  patrol: 20,
  trade: 10,
  pack_open: 25,
  mission: 25,
  zone_capture: 40,
  duel_win: 30,
  duel_lose: 10,
};

export function unitCombatPower(stats: Record<string, unknown>): number {
  const health = Number(stats.health ?? (Number(stats.def ?? 3) * 10));
  const damage = Number(stats.damage ?? stats.atk ?? 5);
  const shield = Number(stats.shield ?? Math.floor(Number(stats.def ?? 3) / 2) + 2);
  return Math.floor(damage + shield + health / 10);
}

export function rollDuelStakes(holdings: { gold: number; materials: number; food: number; faction_currency: number }) {
  const keys = ['gold', 'materials', 'food', 'faction_currency'] as const;
  const count = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...keys].sort(() => Math.random() - 0.5).slice(0, count);
  const stake: Record<string, number> = {};
  for (const k of shuffled) {
    const pct = 0.02 + Math.random() * 0.06;
    stake[k] = Math.max(1, Math.floor(holdings[k] * pct));
  }
  return stake;
}

export function applyZoneYield(
  cmd: { gold: number; materials: number; food: number; faction_currency: number },
  zoneYield: Record<string, number>
): void {
  if (zoneYield.gold) cmd.gold += zoneYield.gold;
  if (zoneYield.materials) cmd.materials += zoneYield.materials;
  if (zoneYield.food) cmd.food += zoneYield.food;
  if (zoneYield.faction_currency) cmd.faction_currency += zoneYield.faction_currency;
}

export function deductCommanderResources(
  cmd: { gold: number; materials: number; food: number; faction_currency: number },
  stake: Record<string, number>
): void {
  if (stake.gold) cmd.gold -= stake.gold;
  if (stake.materials) cmd.materials -= stake.materials;
  if (stake.food) cmd.food -= stake.food;
  if (stake.faction_currency) cmd.faction_currency -= stake.faction_currency;
}

export function addCommanderResources(
  cmd: { gold: number; materials: number; food: number; faction_currency: number },
  bonus: Record<string, number>
): void {
  if (bonus.gold) cmd.gold += bonus.gold;
  if (bonus.materials) cmd.materials += bonus.materials;
  if (bonus.food) cmd.food += bonus.food;
  if (bonus.faction_currency) cmd.faction_currency += bonus.faction_currency;
}

export function expandGridCost(gridSize: number): number {
  return Math.floor(500 * Math.pow(1.5, gridSize - 8));
}
