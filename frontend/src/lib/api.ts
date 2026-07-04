const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function api<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    let message = `Request failed (${res.status})`;
    try {
      const err = JSON.parse(text);
      message = err.error || message;
    } catch {
      if (text.includes('Cannot POST') || text.includes('Cannot GET')) {
        message = 'API not reachable — redeploy may still be in progress';
      }
    }
    throw new Error(message);
  }

  return res.json();
}

export type SoundType = 'complete' | 'notification' | 'click' | 'craft' | 'legendary' | 'missionComplete' | 'buildPlace';

import { isSoundEnabled } from '../stores/settings';

export function playSound(theme: string, type: SoundType) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;

    const play = (freq: number, duration: number, wave: OscillatorType = 'sine', endFreq?: number) => {
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, t);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      osc.start(t);
      osc.stop(t + duration);
    };

    if (theme === 'morty') {
      if (type === 'complete') play(150, 0.3, 'sine', 80);
      else if (type === 'legendary') { play(400, 0.2); setTimeout(() => playSound(theme, 'complete'), 200); }
      else if (type === 'craft') play(300, 0.15, 'square');
      else if (type === 'buildPlace') play(200, 0.2, 'sawtooth', 100);
      else play(180, 0.1);
    } else if (theme === 'enclave') {
      if (type === 'complete' || type === 'missionComplete') play(800, 0.15, 'square');
      else if (type === 'legendary') play(600, 0.3, 'square', 1200);
      else if (type === 'buildPlace') play(500, 0.1, 'square');
      else play(700, 0.08, 'square');
    } else if (theme === 'warlock') {
      if (type === 'complete') play(200, 0.5, 'sine', 100);
      else if (type === 'legendary') play(150, 0.6, 'sine', 50);
      else if (type === 'craft') play(180, 0.3, 'triangle', 90);
      else if (type === 'buildPlace') play(120, 0.4, 'sine', 60);
      else play(160, 0.15, 'sine');
    }
  } catch { /* audio not available */ }
}

export function getUrgencyClass(urgency: string): string {
  return `urgency-${urgency}`;
}

export function formatRelativeTime(date: string): string {
  const hours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getRarityClass(rarity: string): string {
  return `rarity-${rarity}`;
}
