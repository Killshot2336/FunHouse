import { RARITY_COLORS } from './gameConfig';
import type { GameState } from './CommanderVillage';

interface ItemPickerProps {
  label: string;
  inventory: GameState['inventory'];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ItemPicker({ label, inventory, selectedIds, onChange }: ItemPickerProps) {
  const tradeable = inventory.filter((i) => !i.equipped_to_unit && !i.equipped_to_commander);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-bold opacity-70">{label}</div>
      {tradeable.length === 0 ? (
        <p className="text-xs opacity-40">No unequipped items to trade</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
          {tradeable.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggle(item.id)}
                className={`theme-card p-2 text-left text-xs transition-all ${
                  selected ? 'ring-2 ring-current scale-[1.02]' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ borderColor: selected ? RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] : undefined }}
              >
                <div className="font-bold truncate">{item.name}</div>
                <div className="uppercase text-[10px]" style={{ color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}>
                  {item.rarity}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {selectedIds.map((id) => {
            const item = inventory.find((i) => i.id === id);
            if (!item) return null;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="theme-card px-2 py-0.5 text-xs hover:opacity-70"
                title="Tap to remove"
              >
                {item.name} ✕
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ItemChips({
  itemIds,
  itemLabels,
  inventory,
}: {
  itemIds?: string[];
  itemLabels?: Array<{ id: string; name: string; rarity?: string }>;
  inventory: GameState['inventory'];
}) {
  if (!itemIds?.length) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {itemIds.map((id) => {
        const label = itemLabels?.find((l) => l.id === id);
        const item = inventory.find((i) => i.id === id);
        const name = label?.name || item?.name || 'item';
        return (
          <span key={id} className="theme-card px-2 py-0.5 text-xs">
            🎁 {name}
          </span>
        );
      })}
    </div>
  );
}
