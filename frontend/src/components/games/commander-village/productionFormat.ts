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
