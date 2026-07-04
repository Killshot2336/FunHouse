import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, playSound } from '../../../lib/api';
import { CROP_TYPES, ORE_TYPES } from './gameConfig';
import { useCountdown, nextHourIso } from './useCountdown';
import { mergeStockpileDisplay } from './productionFormat';
import type { GameState } from './CommanderVillage';

interface MarketHubProps {
  state: GameState;
  onUpdate: () => void;
}

export function MarketHub({ state, onUpdate }: MarketHubProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const [selling, setSelling] = useState<string | null>(null);
  const stockpile = mergeStockpileDisplay(
    state.commander.stockpile_json || { crops: {}, ores: {}, wood: 0, stone: 0 },
    state.pending_stockpile
  );
  const market = state.market;

  const sell = async (resourceType: string, amount: number) => {
    if (amount <= 0) return;
    setSelling(resourceType);
    try {
      const res = await api<{ gold_earned?: number }>('/game/sell', {
        method: 'POST',
        body: JSON.stringify({ resource_type: resourceType, amount }),
      }, token);
      playSound(user!.theme, 'complete');
      notify(`Sold for ${res.gold_earned ?? '?'}🪙`, 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Sell failed', 'error');
    }
    setSelling(null);
  };

  const sellAllCrop = async (cropKey: string) => {
    const amount = stockpile.crops[cropKey] || 0;
    if (amount > 0) await sell(cropKey, amount);
  };

  const sellAllOres = async () => {
    for (const ore of ORE_TYPES) {
      const amount = stockpile.ores[ore.key] || 0;
      if (amount > 0) await sell(ore.key, amount);
    }
  };

  const resetTarget = market?.market_resets_at || nextHourIso();
  const { label: countdownLabel } = useCountdown(resetTarget);

  return (
    <div className="space-y-4">
      <div className="theme-card p-4">
        <h3 className="text-sm font-bold mb-1">Hourly Market</h3>
        <p className="text-xs opacity-60">
          Prices reset in {countdownLabel} · Hot crop: {market?.hot_crop || '—'} 🔥
        </p>
        <p className="text-[10px] opacity-50 mt-1">
          Harvest crops from your farm first, then sell here. Pending crops show in your totals.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold opacity-60">Crops</h4>
        {CROP_TYPES.map((crop) => {
          const qty = stockpile.crops[crop.key] || 0;
          const price = market?.crop_prices?.[crop.key] || crop.basePrice;
          const isHot = market?.hot_crop === crop.key;
          return (
            <div key={crop.key} className={`theme-card p-3 flex justify-between items-center ${isHot ? 'border-yellow-500/50' : ''}`}>
              <div>
                <span className="font-bold text-sm">{crop.icon} {crop.name}</span>
                <span className="text-xs opacity-60 ml-2">×{qty}</span>
                {isHot && <span className="text-xs text-yellow-400 ml-1">2× HOT</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">{price}🪙/ea</span>
                <button
                  onClick={() => sellAllCrop(crop.key)}
                  disabled={qty === 0 || selling === crop.key}
                  className="theme-btn text-xs px-2 py-1"
                >
                  Sell All
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold opacity-60">Ores</h4>
          <button onClick={sellAllOres} className="theme-btn text-xs px-2 py-1">Sell All Ores</button>
        </div>
        {ORE_TYPES.map((ore) => {
          const qty = stockpile.ores[ore.key] || 0;
          const price = market?.ore_prices?.[ore.key] || ore.basePrice;
          return (
            <div key={ore.key} className="theme-card p-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-sm">{ore.icon} {ore.name}</span>
                <span className="text-xs opacity-60 ml-2">×{qty}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs">{price}🪙/ea</span>
                <button
                  onClick={() => sell(ore.key, qty)}
                  disabled={qty === 0 || selling === ore.key}
                  className="theme-btn text-xs px-2 py-1"
                >
                  Sell All
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(stockpile.wood > 0 || stockpile.stone > 0) && (
        <div className="theme-card p-3 text-xs opacity-60">
          🪵 Wood: {stockpile.wood} · 🪨 Stone: {stockpile.stone} (used in upgrades)
        </div>
      )}
    </div>
  );
}
