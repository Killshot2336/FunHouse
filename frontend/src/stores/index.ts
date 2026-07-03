import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserTheme } from '../themes/copy';

interface AuthState {
  user: User | null;
  token: string | null;
  demoMode: boolean;
  setAuth: (user: User, token: string, demoMode?: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      demoMode: true,
      setAuth: (user, token, demoMode = true) => set({ user, token, demoMode }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'funhouse-auth' }
  )
);

interface ThemeState {
  theme: UserTheme;
  setTheme: (theme: UserTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'morty',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'funhouse-theme' }
  )
);

interface NotificationState {
  message: string | null;
  type: 'success' | 'error' | 'info';
  show: (message: string, type?: 'success' | 'error' | 'info') => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  type: 'info',
  show: (message, type = 'info') => set({ message, type }),
  clear: () => set({ message: null }),
}));

interface BossState {
  health: number;
  maxHealth: number;
  champion: string | null;
  damageFlash: boolean;
  setBoss: (health: number, maxHealth: number, champion?: string | null) => void;
  triggerDamage: () => void;
}

export const useBossStore = create<BossState>((set) => ({
  health: 63,
  maxHealth: 63,
  champion: null,
  damageFlash: false,
  setBoss: (health, maxHealth, champion = null) => set({ health, maxHealth, champion }),
  triggerDamage: () => {
    set({ damageFlash: true });
    setTimeout(() => set({ damageFlash: false }), 500);
  },
}));
