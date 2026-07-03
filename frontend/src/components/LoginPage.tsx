import { useState } from 'react';
import { useAuthStore } from '../stores';
import { api } from '../lib/api';
import { themeCopy, userProfiles } from '../themes/copy';
import { ThemeProvider } from './ThemeProvider';

const USERS = [
  { username: 'edward', displayName: 'Edward', theme: 'morty' as const, password: 'portal' },
  { username: 'dada', displayName: 'Dada', theme: 'enclave' as const, password: 'enclave' },
  { username: 'jamie', displayName: 'Jamie', theme: 'warlock' as const, password: 'warlock' },
];

export function LoginPage() {
  const [selected, setSelected] = useState(USERS[0]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const copy = themeCopy[selected.theme];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api<{ token: string; user: typeof selected; demoMode: boolean }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: selected.username, password }),
      });
      setAuth(res.user, res.token, res.demoMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={selected.theme}>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="theme-card p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-2 tracking-wider">{copy.loginTitle}</h1>
          <p className="text-center text-sm opacity-70 mb-6">{copy.loginSubtitle}</p>

          <div className="flex justify-center gap-4 mb-6">
            {USERS.map((u) => (
              <button
                key={u.username}
                onClick={() => { setSelected(u); setPassword(''); }}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                  selected.username === u.username ? 'border-current scale-110' : 'border-transparent opacity-50'
                }`}
                style={{ color: userProfiles[u.username].color }}
              >
                <span className="text-3xl">{userProfiles[u.username].emoji}</span>
                <span className="text-xs mt-1">{u.displayName}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 bg-transparent border-2 border-current rounded opacity-80 focus:opacity-100 outline-none"
              autoComplete="current-password"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button type="submit" disabled={loading} className="theme-btn theme-btn-primary w-full py-3 font-bold">
              {loading ? 'AUTHENTICATING...' : 'ENTER'}
            </button>
          </form>

          <p className="text-xs text-center mt-4 opacity-40">
            Demo passwords: portal / enclave / warlock
          </p>
        </div>
      </div>
    </ThemeProvider>
  );
}
