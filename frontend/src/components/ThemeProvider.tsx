import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useThemeStore } from '../stores';
import type { UserTheme } from '../themes/copy';
import { PortalBackground } from './effects/PortalBackground';
import { TacticalOverlay } from './effects/TacticalOverlay';
import { ArcaneMist } from './effects/ArcaneMist';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ThemeProviderProps {
  theme: UserTheme;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const setTheme = useThemeStore((s) => s.setTheme);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setTheme(theme);
  }, [theme, setTheme]);

  const bgClass = theme === 'morty' ? 'portal-bg starfield' : theme === 'enclave' ? 'portal-bg tactical-grid' : 'portal-bg parchment-texture';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {!reducedMotion && theme === 'morty' && <PortalBackground />}
      {!reducedMotion && theme === 'enclave' && <TacticalOverlay />}
      {!reducedMotion && theme === 'warlock' && <ArcaneMist />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
