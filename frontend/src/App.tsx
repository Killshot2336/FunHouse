import { useEffect, useState } from 'react';
import { useAuthStore } from './stores';
import { ThemeProvider } from './components/ThemeProvider';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { InstallPrompt } from './components/InstallPrompt';
import { api } from './lib/api';

export default function App() {
  const { user, token, hydrated, setAuth, resetDevice } = useAuthStore();
  const [checking, setChecking] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-50 tracking-wider">LOADING FUNHOUSE...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <ThemeProvider theme={user.theme}>
      <InstallPrompt />
      <Layout />
    </ThemeProvider>
  );
}
