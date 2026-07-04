import { useEffect, useState } from 'react';

export function useCountdown(targetIso?: string): { label: string; done: boolean } {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!targetIso) return { label: '—', done: true };

  const targetMs = new Date(targetIso).getTime();
  if (Number.isNaN(targetMs)) return { label: '—', done: true };

  const remaining = Math.max(0, targetMs - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return {
    label: `${mins}:${secs.toString().padStart(2, '0')}`,
    done: remaining <= 0,
  };
}

export function nextHourIso(): string {
  const nextHour = (Math.floor(Date.now() / 3600000) + 1) * 3600000;
  return new Date(nextHour).toISOString();
}

export function nextDungeonResetIso(): string {
  const next = (Math.floor(Date.now() / 1800000) + 1) * 1800000;
  return new Date(next).toISOString();
}
