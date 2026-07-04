import { createPortal } from 'react-dom';
import { RARITY_COLORS } from './gameConfig';
import type { LootItemDef } from './gameConfig';

interface ItemInfoModalProps {
  item: LootItemDef | { name: string; rarity: string; description?: string; use_hint?: string; item_type?: string; sellValue?: number };
  onClose: () => void;
}

export function ItemInfoModal({ item, onClose }: ItemInfoModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} details`}
    >
      <div
        className="holo-card holo-card-intense p-4 max-w-sm w-full space-y-3"
        style={{ background: 'var(--card-bg)', color: 'var(--text-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-base">{item.name}</h3>
            <p className="text-xs uppercase" style={{ color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}>
              {item.rarity}
            </p>
          </div>
          <button type="button" onClick={onClose} className="theme-btn text-xs px-2 py-1">✕</button>
        </div>
        {'description' in item && item.description ? (
          <p className="text-sm opacity-90">{item.description}</p>
        ) : (
          <p className="text-sm opacity-60 italic">No description available.</p>
        )}
        {'use_hint' in item && item.use_hint && (
          <p className="text-xs opacity-70">💡 {item.use_hint}</p>
        )}
        {'sellValue' in item && item.sellValue !== undefined && (
          <p className="text-sm font-bold">Sell value: {item.sellValue}🪙</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
