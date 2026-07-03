import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useThemeStore } from '../stores';
import type { UserTheme } from '../themes/copy';

interface ThemeProviderProps {
  theme: UserTheme;
  children: ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setTheme(theme);
  }, [theme, setTheme]);

  const bgClass = theme === 'morty' ? 'portal-bg starfield' : theme === 'enclave' ? 'portal-bg tactical-grid' : 'portal-bg parchment-texture';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
