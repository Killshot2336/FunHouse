import { RARITY_COLORS } from './gameConfig';
import type { LootItemDef } from './gameConfig';

interface ItemInfoModalProps {
  item: LootItemDef | { name: string; rarity: string; description?: string; use_hint?: string; item_type?: string; sellValue?: number };
  onClose: () => void;
}

export function ItemInfoModal({ item, onClose }: ItemInfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="theme-card p-4 max-w-sm w-full space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-xs uppercase" style={{ color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}>
              {item.rarity}
            </p>
          </div>
          <button onClick={onClose} className="text-xs opacity-50">✕</button>
        </div>
        {'description' in item && item.description && (
          <p className="text-sm opacity-80">{item.description}</p>
        )}
        {'use_hint' in item && item.use_hint && (
          <p className="text-xs opacity-60">💡 {item.use_hint}</p>
        )}
        {'sellValue' in item && item.sellValue !== undefined && (
          <p className="text-xs">Sell value: {item.sellValue}🪙</p>
        )}
      </div>
    </div>
  );
}
