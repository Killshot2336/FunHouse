const MAX_ACCRUE_SECONDS = 8 * 3600;

export function secondsSince(iso: string, now = Date.now()): number {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return 0;
  return Math.min(MAX_ACCRUE_SECONDS, Math.max(0, (now - ms) / 1000));
}

export function liveProduction(ratePerHour: number, elapsedSeconds: number): number {
  return (ratePerHour / 3600) * elapsedSeconds;
}

export function ratePerMinute(ratePerHour: number): number {
  return ratePerHour / 60;
}

export function formatMinSec(totalSeconds: number): string {
  const s = Math.floor(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export interface StockpileLike {
  crops: Record<string, number>;
  ores: Record<string, number>;
  wood: number;
  stone: number;
}

export function mergeStockpileDisplay(stored: StockpileLike, pending?: StockpileLike | null): StockpileLike {
  const base = {
    crops: { ...stored.crops },
    ores: { ...stored.ores },
    wood: stored.wood || 0,
    stone: stored.stone || 0,
  };
  if (!pending) return base;
  for (const [k, v] of Object.entries(pending.crops || {})) {
    base.crops[k] = (base.crops[k] || 0) + v;
  }
  for (const [k, v] of Object.entries(pending.ores || {})) {
    base.ores[k] = (base.ores[k] || 0) + v;
  }
  base.wood += pending.wood || 0;
  base.stone += pending.stone || 0;
  return base;
}

export interface WalletLike {
  gold: number;
  materials: number;
  food?: number;
  faction: number;
}

export function hasPendingStockpile(pending?: StockpileLike | null): boolean {
  if (!pending) return false;
  if (pending.wood > 0 || pending.stone > 0) return true;
  if (Object.values(pending.crops || {}).some((v) => v > 0)) return true;
  if (Object.values(pending.ores || {}).some((v) => v > 0)) return true;
  return false;
}

export function hasPendingWallet(pending?: WalletLike | null): boolean {
  if (!pending) return false;
  return pending.gold > 0 || pending.materials > 0 || (pending.food || 0) > 0 || pending.faction > 0;
}

export function formatPendingSummary(
  pendingStockpile?: StockpileLike | null,
  pendingWallet?: WalletLike | null
): string {
  const parts: string[] = [];
  const w = pendingWallet;
  if (w?.gold) parts.push(`${Math.floor(w.gold)}🪙`);
  if (w?.materials) parts.push(`${Math.floor(w.materials)}⛏️`);
  if (w?.faction) parts.push(`${Math.floor(w.faction)}⭐`);
  const s = pendingStockpile;
  if (s) {
    const cropTotal = Object.values(s.crops || {}).reduce((a, b) => a + b, 0);
    if (cropTotal > 0) parts.push(`${Math.floor(cropTotal)}🌾`);
    if (s.wood > 0) parts.push(`${Math.floor(s.wood)}🪵`);
    if (s.stone > 0) parts.push(`${Math.floor(s.stone)}🪨`);
    const oreTotal = Object.values(s.ores || {}).reduce((a, b) => a + b, 0);
    if (oreTotal > 0) parts.push(`${Math.floor(oreTotal)}💎`);
  }
  return parts.join(' · ');
}

/** Live totals = banked + in-progress production (for header counters) */
export function liveWalletTotals(
  commander: { gold: number; materials: number; faction_currency: number },
  pending?: WalletLike | null
) {
  return {
    gold: commander.gold + Math.floor(pending?.gold || 0),
    materials: commander.materials + Math.floor(pending?.materials || 0),
    faction: commander.faction_currency + Math.floor(pending?.faction || 0),
  };
}

export function liveStockpileTotals(
  stored: StockpileLike,
  pending?: StockpileLike | null
): StockpileLike {
  const merged = mergeStockpileDisplay(stored, pending);
  return {
    crops: Object.fromEntries(
      Object.entries(merged.crops).map(([k, v]) => [k, Math.floor(v)])
    ),
    ores: Object.fromEntries(
      Object.entries(merged.ores).map(([k, v]) => [k, Math.floor(v)])
    ),
    wood: Math.floor(merged.wood),
    stone: Math.floor(merged.stone),
  };
}
