import { useState } from 'react';
import { useAuthStore } from '../stores';
import { api } from '../lib/api';
import { themeCopy, userProfiles } from '../themes/copy';

const USERS = [
  { username: 'aden', displayName: 'Aden', theme: 'morty' as const },
  { username: 'edward', displayName: 'Edward', theme: 'enclave' as const },
  { username: 'jamie', displayName: 'Jamie', theme: 'warlock' as const },
];

export function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handlePick = async (selected: typeof USERS[0]) => {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ token: string; user: typeof selected; demoMode: boolean }>('/auth/identify', {
        method: 'POST',
        body: JSON.stringify({ username: selected.username }),
      });
      setAuth(res.user, res.token, res.demoMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black/20 to-transparent">
      <div className="theme-card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 tracking-wider">Funhouse</h1>
        <p className="text-center text-sm opacity-70 mb-8">Tap who you are. This device stays locked to you.</p>

        <div className="flex flex-col gap-4">
          {USERS.map((u) => {
            const copy = themeCopy[u.theme];
            return (
              <button
                key={u.username}
                onClick={() => handlePick(u)}
                disabled={loading}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-current/30 hover:border-current hover:scale-[1.02] transition-all disabled:opacity-50"
                style={{ color: userProfiles[u.username].color }}
              >
                <span className="text-4xl">{userProfiles[u.username].emoji}</span>
                <div className="text-left">
                  <div className="font-bold text-lg">{u.displayName}</div>
                  <div className="text-xs opacity-60">{copy.loginSubtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
        {loading && <p className="text-center text-sm opacity-50 mt-4">Connecting...</p>}

        <p className="text-xs text-center mt-6 opacity-40">
          One tap per device. Jamie&apos;s phone is always Jamie.
        </p>
      </div>
    </div>
  );
}
