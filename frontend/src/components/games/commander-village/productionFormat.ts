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
