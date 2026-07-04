import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  soundEnabled: boolean;
  reducedMotion: boolean | null;
  gameNotifications: boolean;
  setSoundEnabled: (v: boolean) => void;
  setReducedMotion: (v: boolean | null) => void;
  setGameNotifications: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      reducedMotion: null,
      gameNotifications: true,
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setGameNotifications: (gameNotifications) => set({ gameNotifications }),
    }),
    { name: 'funhouse-settings' }
  )
);

export function isSoundEnabled(): boolean {
  return useSettingsStore.getState().soundEnabled;
}

export function isReducedMotionPreferred(): boolean {
  const override = useSettingsStore.getState().reducedMotion;
  if (override !== null) return override;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
