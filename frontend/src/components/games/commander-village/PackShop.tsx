import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../../stores';
import { api, getRarityClass, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { PACK_TYPES, RARITY_LABELS, RARITY_COLORS, type PackType, type Rarity } from './gameConfig';
import { TroopCard } from './TroopCard';
import type { GameState } from './CommanderVillage';

interface PackShopProps {
  state: GameState;
  onUpdate: () => void;
}

interface PackRoll {
  unitKey?: string;
  itemId?: string;
  name: string;
  icon?: string;
  rarity: Rarity;
  stats: Record<string, unknown>;
  item_type?: string;
}

interface PackResult {
  result_type?: 'troop' | 'item';
  unit?: { unit_key: string; stats: Record<string, unknown> };
  inventory_item?: { name: string; rarity: string; stats: Record<string, number>; item_id: string };
  roll: PackRoll;
  full?: boolean;
  refund?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  troop: 'Troops',
  weapon: 'Weapons',
  armor: 'Armor',
  mixed: 'Mystery',
};

function formatCost(cost: Record<string, number>) {
  const icons: Record<string, string> = { gold: '🪙', materials: '⛏️', faction_currency: '⭐' };
  return Object.entries(cost).map(([k, v]) => `${v}${icons[k] || ''}`).join(' ');
}

function canAfford(state: GameState, cost: Record<string, number>) {
  const c = state.commander;
  if ((cost.gold || 0) > c.gold) return false;
  if ((cost.materials || 0) > c.materials) return false;
  if ((cost.faction_currency || 0) > c.faction_currency) return false;
  return true;
}

export function PackShop({ state, onUpdate }: PackShopProps) {
  const { user, token } = useAuthStore();
  const { triggerFlash, burst } = useCinematicStore();
  const [opening, setOpening] = useState<PackType | null>(null);
  const [result, setResult] = useState<PackResult | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const openPack = async (packType: PackType) => {
    setOpening(packType);
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
      burst(50, 50, 16);
      onUpdate();
    } catch { /* ignore */ }
    setOpening(null);
  };

  const packs = (Object.entries(PACK_TYPES) as [PackType, typeof PACK_TYPES[PackType]][])
    .filter(([, p]) => filter === 'all' || p.category === filter);

  const categories = ['all', 'troop', 'weapon', 'armor', 'mixed'];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-xl theme-card p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <h3 className="text-base font-bold relative">Pack Shop</h3>
        <p className="text-xs opacity-60 relative mt-1">
          RNG pulls — troops, weapons & armor. Trade duplicates or equip your hits.
        </p>
        <div className="flex gap-1 mt-3 flex-wrap relative">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                filter === cat ? 'border-current bg-current/10 font-bold' : 'border-current/30 opacity-60'
              }`}
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {packs.map(([key, pack]) => {
          const affordable = canAfford(state, pack.cost);
          const isOpening = opening === key;
          const categoryColor =
            pack.category === 'weapon' ? 'from-red-500/20' :
            pack.category === 'armor' ? 'from-blue-500/20' :
            pack.category === 'mixed' ? 'from-amber-500/20' : 'from-green-500/20';

          return (
            <motion.button
              key={key}
              onClick={() => openPack(key)}
              disabled={!!opening || !affordable}
              whileHover={affordable ? { scale: 1.02 } : undefined}
              whileTap={affordable ? { scale: 0.98 } : undefined}
              className={`relative overflow-hidden theme-card p-4 text-left transition-all ${
                !affordable ? 'opacity-40' : 'hover:shadow-lg'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${categoryColor} to-transparent pointer-events-none`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl drop-shadow">{pack.icon}</span>
                  <div>
                    <div className="font-bold text-sm">{pack.name}</div>
                    <div className="text-[10px] uppercase opacity-40 tracking-wide">{pack.category}</div>
                    <div className="text-xs opacity-60 mt-0.5 line-clamp-2">{pack.desc}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold">{formatCost(pack.cost)}</div>
                  <div className={`mt-2 text-xs px-2 py-1 rounded ${
                    isOpening ? 'animate-pulse bg-current/20' : 'theme-btn theme-btn-primary'
                  }`}>
                    {isOpening ? '...' : 'OPEN'}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-3"
          >
            <div className="theme-card p-4 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-current/5 to-transparent pointer-events-none" />
              <div className="text-xs uppercase tracking-widest opacity-50 mb-2">You pulled</div>

              {result.full ? (
                <div className="text-sm">
                  Army full! Refunded {result.refund}🪙 — pulled {result.roll.name} ({RARITY_LABELS[result.roll.rarity]})
                </div>
              ) : result.result_type === 'item' || result.inventory_item ? (
                <div className={`inline-block p-4 rounded-lg border-2 ${getRarityClass(result.roll.rarity)}`}
                  style={{ borderColor: RARITY_COLORS[result.roll.rarity] }}>
                  <div className="text-2xl mb-1">🎁</div>
                  <div className="font-bold">{result.inventory_item?.name || result.roll.name}</div>
                  <div className="text-xs uppercase mt-1" style={{ color: RARITY_COLORS[result.roll.rarity] }}>
                    {RARITY_LABELS[result.roll.rarity]}
                  </div>
                  {result.inventory_item?.stats && Object.keys(result.inventory_item.stats).length > 0 && (
                    <div className="text-xs opacity-60 mt-2">
                      {Object.entries(result.inventory_item.stats).map(([k, v]) => (
                        <span key={k} className="mr-2">{k}: +{v}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] opacity-50 mt-2">Added to Inventory — equip or trade it!</p>
                </div>
              ) : (
                <TroopCard
                  name={result.roll.name}
                  icon={result.roll.icon || '⚔️'}
                  rarity={result.roll.rarity}
                  stats={result.roll.stats}
                />
              )}
            </div>
            <button onClick={() => setResult(null)} className="theme-btn w-full text-xs">Pull Again</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="theme-card p-3 text-center text-xs opacity-50">
        Pity tracker · {state.pity?.rolls_since_rare ?? 0} since rare · {state.pity?.rolls_since_legendary ?? 0} since legendary
      </div>
    </div>
  );
}
