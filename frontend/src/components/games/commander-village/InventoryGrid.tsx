import { useState } from 'react';
import { useAuthStore } from '../../../stores';
import { api, getRarityClass } from '../../../lib/api';
import { RARITY_COLORS, itemSellPrice } from './gameConfig';
import { ItemInfoModal } from './ItemInfoModal';
import type { GameState } from './CommanderVillage';
import type { LootItemDef } from './gameConfig';

interface InventoryGridProps {
  state: GameState;
  onUpdate: () => void;
}

export function InventoryGrid({ state, onUpdate }: InventoryGridProps) {
  const { token } = useAuthStore();
  const [infoItem, setInfoItem] = useState<LootItemDef | null>(null);
  const items = (state.config.items || []) as LootItemDef[];

  const sell = async (id: string) => {
    await api(`/game/inventory/${id}/sell`, { method: 'POST' }, token);
    onUpdate();
  };

  const sellAll = async () => {
    for (const item of state.inventory) {
      if (!item.equipped_to_unit) {
        await api(`/game/inventory/${item.id}/sell`, { method: 'POST' }, token);
      }
    }
    onUpdate();
  };

  const equip = async (itemId: string, unitId: string) => {
    await api(`/game/inventory/${itemId}/equip`, {
      method: 'POST',
      body: JSON.stringify({ unit_id: unitId, slot: 'weapon' }),
    }, token);
    onUpdate();
  };

  const getItemDef = (itemId: string) => items.find((i) => i.id === itemId);

  if (!state.inventory.length) {
    return <div className="theme-card p-6 text-center opacity-60 text-sm">No loot yet. Send a patrol!</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={sellAll} className="theme-btn text-xs px-3 py-1">Sell All Unequipped</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {state.inventory.map((item) => {
          const def = getItemDef(item.item_id);
          const sellPrice = itemSellPrice(item.item_id, item.rarity, items);
          return (
            <div
              key={item.id}
              className={`theme-card p-3 ${getRarityClass(item.rarity)}`}
              style={{ borderColor: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}
            >
              <div className="flex justify-between items-start">
                <div className="font-bold text-sm">{item.name}</div>
                {def && (
                  <button onClick={() => setInfoItem(def)} className="text-xs opacity-50 hover:opacity-100">ℹ️</button>
                )}
              </div>
              <div className="text-xs uppercase mb-1" style={{ color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}>
                {item.rarity}
              </div>
              {def?.description && (
                <p className="text-[10px] opacity-50 mb-1 line-clamp-2">{def.description}</p>
              )}
              {Object.entries(item.stats).map(([k, v]) => (
                <div key={k} className="text-xs opacity-60">{k}: +{v}</div>
              ))}
              <div className="text-xs opacity-50 mt-1">Sell: {sellPrice}🪙</div>
              <div className="flex gap-1 mt-2">
                {!item.equipped_to_unit && state.units[0] && (
                  <button onClick={() => equip(item.id, state.units[0].id)} className="theme-btn text-xs flex-1">
                    Equip
                  </button>
                )}
                <button onClick={() => sell(item.id)} className="theme-btn text-xs flex-1">Sell</button>
              </div>
            </div>
          );
        })}
      </div>
      {infoItem && <ItemInfoModal item={infoItem} onClose={() => setInfoItem(null)} />}
    </div>
  );
}
