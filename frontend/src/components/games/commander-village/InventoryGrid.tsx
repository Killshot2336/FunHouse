import { useAuthStore } from '../../../stores';
import { api, getRarityClass } from '../../../lib/api';
import { RARITY_COLORS } from './gameConfig';
import type { GameState } from './CommanderVillage';

interface InventoryGridProps {
  state: GameState;
  onUpdate: () => void;
}

export function InventoryGrid({ state, onUpdate }: InventoryGridProps) {
  const { token } = useAuthStore();

  const sell = async (id: string) => {
    await api(`/game/inventory/${id}/sell`, { method: 'POST' }, token);
    onUpdate();
  };

  const equip = async (itemId: string, unitId: string) => {
    await api(`/game/inventory/${itemId}/equip`, {
      method: 'POST',
      body: JSON.stringify({ unit_id: unitId, slot: 'weapon' }),
    }, token);
    onUpdate();
  };

  if (!state.inventory.length) {
    return <div className="theme-card p-6 text-center opacity-60 text-sm">No loot yet. Send a patrol!</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {state.inventory.map((item) => (
        <div
          key={item.id}
          className={`theme-card p-3 ${getRarityClass(item.rarity)}`}
          style={{ borderColor: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}
        >
          <div className="font-bold text-sm">{item.name}</div>
          <div className="text-xs uppercase mb-2" style={{ color: RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] }}>
            {item.rarity}
          </div>
          {Object.entries(item.stats).map(([k, v]) => (
            <div key={k} className="text-xs opacity-60">{k}: +{v}</div>
          ))}
          <div className="flex gap-1 mt-2">
            {!item.equipped_to_unit && state.units[0] && (
              <button onClick={() => equip(item.id, state.units[0].id)} className="theme-btn text-xs flex-1">
                Equip
              </button>
            )}
            <button onClick={() => sell(item.id)} className="theme-btn text-xs flex-1">Sell</button>
          </div>
        </div>
      ))}
    </div>
  );
}
