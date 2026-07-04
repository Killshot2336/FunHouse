import { create } from 'zustand';

export type FlashType = 'none' | 'success' | 'damage' | 'legendary' | 'portal';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface CinematicState {
  shaking: boolean;
  flash: FlashType;
  particles: Particle[];
  triggerShake: (intensity?: 'light' | 'heavy') => void;
  triggerFlash: (type: FlashType) => void;
  burst: (x?: number, y?: number, count?: number) => void;
  tickParticles: () => void;
  clearFlash: () => void;
}

let particleId = 0;

export const useCinematicStore = create<CinematicState>((set, get) => ({
  shaking: false,
  flash: 'none',
  particles: [],

  triggerShake: () => {
    set({ shaking: true });
    setTimeout(() => set({ shaking: false }), 500);
  },

  triggerFlash: (type) => {
    set({ flash: type });
    setTimeout(() => set({ flash: 'none' }), 600);
  },

  burst: (x = 50, y = 50, count = 40) => {
    const colors = ['#39ff14', '#00ff41', '#ffffff', '#ffd700', '#ff6b6b'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 6;
      newParticles.push({
        id: particleId++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        life: 1,
      });
    }
    set({ particles: [...get().particles, ...newParticles].slice(-120) });
  },

  tickParticles: () => {
    const updated = get().particles
      .map((p) => ({
        ...p,
        x: p.x + p.vx * 0.3,
        y: p.y + p.vy * 0.3,
        vy: p.vy + 0.15,
        life: p.life - 0.025,
      }))
      .filter((p) => p.life > 0);
    set({ particles: updated });
  },

  clearFlash: () => set({ flash: 'none' }),
}));
