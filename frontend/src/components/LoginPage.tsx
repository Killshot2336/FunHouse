import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores';
import { useCinematicStore } from '../stores/cinematic';
import { api } from '../lib/api';
import { themeCopy, userProfiles } from '../themes/copy';
import { HoloCard } from './effects/HoloCard';

const USERS = [
  { username: 'aden', displayName: 'Aden', theme: 'morty' as const, tagline: 'Interdimensional Commander' },
  { username: 'edward', displayName: 'Edward', theme: 'enclave' as const, tagline: 'Enclave Operative' },
  { username: 'jamie', displayName: 'Jamie', theme: 'warlock' as const, tagline: 'Patron\'s Champion' },
];

export function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [warping, setWarping] = useState(false);
  const { setAuth } = useAuthStore();
  const { triggerFlash, burst, triggerShake } = useCinematicStore();

  const handlePick = async (selected: typeof USERS[0]) => {
    setLoading(selected.username);
    setError('');
    setWarping(true);
    triggerShake();
    triggerFlash('portal');
    burst(50, 45, 60);

    try {
      const res = await api<{ token: string; user: typeof selected; demoMode: boolean }>('/auth/identify', {
        method: 'POST',
        body: JSON.stringify({ username: selected.username }),
      });
      await new Promise((r) => setTimeout(r, 800));
      setAuth(res.user, res.token, res.demoMode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect');
      setWarping(false);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-black"
        animate={warping ? { scale: 3, opacity: 0, rotate: 15 } : { scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.8 }}
        style={{ background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10 relative z-10"
      >
        <motion.h1
          className="text-5xl font-bold tracking-[0.3em] glow-text glitch-text mb-3"
          animate={{ textShadow: ['0 0 20px var(--accent-glow)', '0 0 40px var(--accent-glow)', '0 0 20px var(--accent-glow)'] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          FUNHOUSE
        </motion.h1>
        <p className="text-sm opacity-60 tracking-widest uppercase">Household Command Center</p>
        <motion.div
          className="h-px w-48 mx-auto mt-4 bg-gradient-to-r from-transparent via-current to-transparent opacity-40"
          animate={{ scaleX: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 4 }}
        />
      </motion.div>

      <div className="w-full max-w-lg space-y-4 relative z-10">
        <AnimatePresence>
          {USERS.map((u, i) => (
            <HoloCard
              key={u.username}
              intense
              delay={i * 0.15}
              onClick={() => !loading && handlePick(u)}
              className={`cursor-pointer ${loading === u.username ? 'opacity-80' : ''}`}
            >
                <div className="p-5 flex items-center gap-5">
                  <motion.span
                    className="text-5xl"
                    animate={{ y: [0, -6, 0], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i, ease: 'easeInOut' }}
                  >
                    {userProfiles[u.username].emoji}
                  </motion.span>
                  <div className="flex-1">
                    <div className="font-bold text-xl tracking-wider" style={{ color: userProfiles[u.username].color }}>
                      {u.displayName}
                    </div>
                    <div className="text-xs opacity-50 mt-1">{u.tagline}</div>
                    <div className="text-[10px] opacity-40 mt-1 italic">{themeCopy[u.theme].loginSubtitle}</div>
                  </div>
                  <motion.div
                    className="text-2xl opacity-40"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.div>
                </div>
                {loading === u.username && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <span className="tracking-widest text-sm animate-pulse">WARPING IN...</span>
                  </motion.div>
                )}
              </HoloCard>
          ))}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm mt-6 z-10">
          {error}
        </motion.p>
      )}

      <p className="text-[10px] text-center mt-8 opacity-30 tracking-wider z-10">
        ONE TAP · LOCKED TO DEVICE · NO PASSWORDS
      </p>
    </div>
  );
}
