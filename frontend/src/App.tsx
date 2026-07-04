import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from './stores';
import { ThemeProvider } from './components/ThemeProvider';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { InstallPrompt } from './components/InstallPrompt';
import { CinematicOverlay } from './components/effects/CinematicOverlay';
import { api } from './lib/api';

export default function App() {
  const { user, token, hydrated, setAuth, resetDevice, setHydrated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  // Fallback: never stay stuck on loading if zustand hydration hangs
  useEffect(() => {
    const t = setTimeout(() => setHydrated(), 1500);
    return () => clearTimeout(t);
  }, [setHydrated]);

  useEffect(() => {
    if (!hydrated) return;

    async function validateSession() {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const res = await api<{ user: typeof user; demoMode: boolean }>('/auth/me', {}, token);
        if (res.user) {
          setAuth(res.user, token, res.demoMode);
        }
      } catch {
        resetDevice();
      } finally {
        setChecking(false);
      }
    }

    validateSession();
  }, [hydrated, token, setAuth, resetDevice]);

  if (!hydrated || checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.p
          style={{ color: '#39ff14', fontSize: 14, letterSpacing: '0.3em', fontFamily: 'monospace' }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          LOADING FUNHOUSE...
        </motion.p>
      </div>
    );
  }

  if (!user) return (
    <ThemeProvider theme="morty">
      <CinematicOverlay />
      <LoginPage />
    </ThemeProvider>
  );

  return (
    <ThemeProvider theme={user.theme}>
      <CinematicOverlay />
      <InstallPrompt />
      <Layout />
    </ThemeProvider>
  );
}
