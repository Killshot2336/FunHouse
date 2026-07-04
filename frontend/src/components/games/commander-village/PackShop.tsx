import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { PACK_TYPES, RARITY_LABELS, type PackType, type Rarity } from './gameConfig';
import { TroopCard } from './TroopCard';
import type { GameState } from './CommanderVillage';

interface PackShopProps {
  state: GameState;
  onUpdate: () => void;
}

interface PackResult {
  unit?: { unit_key: string; stats: Record<string, unknown> };
  roll: { unitKey: string; name: string; icon: string; rarity: Rarity; stats: Record<string, unknown> };
  full?: boolean;
  refund?: number;
}

export function PackShop({ state, onUpdate }: PackShopProps) {
  const { user, token } = useAuthStore();
  const { triggerFlash, burst } = useCinematicStore();
  const [opening, setOpening] = useState(false);
  const [result, setResult] = useState<PackResult | null>(null);

  const openPack = async (packType: PackType) => {
    setOpening(true);
    setResult(null);
    try {
      const res = await api<PackResult>('/game/packs/open', {
        method: 'POST',
        body: JSON.stringify({ pack_type: packType }),
      }, token);
      setResult(res);
      const rarity = res.roll.rarity;
      if (rarity === 'legendary' || rarity === 'mythic') {
        triggerFlash('legendary');
        playSound(user!.theme, 'legendary');
      } else {
        triggerFlash('success');
        playSound(user!.theme, 'craft');
      }
      burst(50, 50, 12);
      onUpdate();
    } catch { /* ignore */ }
    setOpening(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold">Character Packs</h3>
      <p className="text-xs opacity-50">Pull troops with random rarity — Grey to Mythical!</p>

      <div className="grid grid-cols-1 gap-3">
        {(Object.entries(PACK_TYPES) as [PackType, typeof PACK_TYPES[PackType]][]).map(([key, pack]) => {
          const costStr = Object.entries(pack.cost).map(([k, v]) => {
            const icons: Record<string, string> = { gold: '🪙', materials: '⛏️', faction_currency: '⭐' };
            return `${v}${icons[k] || ''}`;
          }).join(' ');
          return (
            <button
              key={key}
              onClick={() => openPack(key)}
              disabled={opening}
              className="theme-card p-4 flex items-center justify-between hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{pack.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-sm">{pack.name}</div>
                  <div className="text-xs opacity-50">{costStr}</div>
                </div>
              </div>
              <span className="theme-btn theme-btn-primary text-xs px-3 py-1">
                {opening ? '...' : 'OPEN'}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            className="space-y-3"
          >
            {result.full ? (
              <div className="theme-card p-4 text-center text-sm">
                Army full! Refunded {result.refund}🪙 — pulled {result.roll.name} ({RARITY_LABELS[result.roll.rarity]})
              </div>
            ) : (
              <TroopCard
                name={result.roll.name}
                icon={result.roll.icon}
                rarity={result.roll.rarity}
                stats={result.roll.stats}
              />
            )}
            <button onClick={() => setResult(null)} className="theme-btn w-full text-xs">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-xs opacity-40 text-center">
        Pity: {state.pity?.rolls_since_rare ?? 0} since rare · {state.pity?.rolls_since_legendary ?? 0} since legendary
      </div>
    </div>
  );
}
