import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '../../../stores';
import { api, getRarityClass, playSound } from '../../../lib/api';
import { useCinematicStore } from '../../../stores/cinematic';
import { RARITY_COLORS, itemSellPrice, getEquipSlotForItem, canEquipOnCommander, canEquipOnUnit } from './gameConfig';
import { ItemInfoModal } from './ItemInfoModal';
import { GameModal } from './GameModal';
import type { GameState } from './CommanderVillage';
import type { LootItemDef } from './gameConfig';

interface InventoryGridProps {
  state: GameState;
  onUpdate: () => void;
}

interface EquipResult {
  item: { name: string };
  unit: { unit_key: string };
  bonus?: string;
  unit_name?: string;
  slot?: string;
}

function formatBonus(itemStats: Record<string, number>): string {
  const labels: Record<string, string> = { atk: 'ATK', def: 'DEF', spd: 'SPD', luck: 'LUCK' };
  return Object.entries(itemStats)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `+${v} ${labels[k] || k.toUpperCase()}`)
    .join(', ');
}

export function InventoryGrid({ state, onUpdate }: InventoryGridProps) {
  const { user, token } = useAuthStore();
  const notify = useNotificationStore((s) => s.show);
  const { triggerFlash } = useCinematicStore();
  const [infoItem, setInfoItem] = useState<LootItemDef | null>(null);
  const [equipTarget, setEquipTarget] = useState<{
    itemId: string; itemName: string; itemType: string; stats: Record<string, number>; rarity: string;
  } | null>(null);
  const [equipping, setEquipping] = useState(false);
  const items = (state.config.items || []) as LootItemDef[];

  const unitName = (unitKey: string) =>
    state.config.units.find((u) => u.key === unitKey)?.name || unitKey;

  const sell = async (id: string) => {
    await api(`/game/inventory/${id}/sell`, { method: 'POST' }, token);
    notify('Item sold for gold', 'success');
    onUpdate();
  };

  const sellAll = async () => {
    let count = 0;
    for (const item of state.inventory) {
      if (!item.equipped_to_unit && !item.equipped_to_commander) {
        await api(`/game/inventory/${item.id}/sell`, { method: 'POST' }, token);
        count++;
      }
    }
    notify(`Sold ${count} item(s)`, 'success');
    onUpdate();
  };

  const equipTroop = async (itemId: string, unitId: string, itemName: string, itemStats: Record<string, number>, rarity: string) => {
    setEquipping(true);
    try {
      const slot = getEquipSlotForItem(
        state.inventory.find((i) => i.id === itemId)?.item_id || '',
        items
      );
      const res = await api<EquipResult>(`/game/inventory/${itemId}/equip`, {
        method: 'POST',
        body: JSON.stringify({ unit_id: unitId, slot }),
      }, token);
      const troop = res.unit_name || unitName(res.unit.unit_key);
      const bonus = res.bonus || formatBonus(itemStats);
      setEquipTarget(null);
      notify(`Equipped ${itemName} on ${troop} (${bonus})`, 'success');
      triggerFlash(rarity === 'mythic' || rarity === 'legendary' ? 'legendary' : 'success');
      playSound(user!.theme, rarity === 'mythic' || rarity === 'legendary' ? 'legendary' : 'craft');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Equip failed', 'error');
    }
    setEquipping(false);
  };

  const equipCommander = async (itemId: string, itemName: string, rarity: string) => {
    setEquipping(true);
    try {
      const res = await api<{ bonus?: string }>('/game/commander/equip', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId }),
      }, token);
      setEquipTarget(null);
      notify(`Equipped ${itemName} on Commander (${res.bonus || 'boosted'})`, 'success');
      triggerFlash(rarity === 'mythic' || rarity === 'legendary' ? 'legendary' : 'success');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Equip failed', 'error');
    }
    setEquipping(false);
  };

  const redeemBlueprint = async (itemId: string) => {
    try {
      const res = await api<{
        result: { type: string; building_key: string; value: number };
        building_name: string;
        building_icon: string;
      }>(`/game/inventory/${itemId}/redeem`, { method: 'POST' }, token);
      const msg = res.result.type === 'discount'
        ? `Blueprint redeemed: ${Math.round(res.result.value * 100)}% off ${res.building_icon} ${res.building_name}!`
        : `Blueprint redeemed: Free ${res.building_icon} ${res.building_name} building!`;
      notify(msg, 'success');
      triggerFlash('legendary');
      onUpdate();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Redeem failed', 'error');
    }
  };

  const getItemDef = (itemId: string) => items.find((i) => i.id === itemId);

  if (!state.inventory.length) {
    return <div className="theme-card p-6 text-center opacity-60 text-sm">No loot yet. Send a patrol or open packs!</div>;
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
          const equippedUnit = item.equipped_to_unit
            ? state.units.find((u) => u.id === item.equipped_to_unit)
            : null;
          const equippedName = equippedUnit ? unitName(equippedUnit.unit_key) : null;
          const isBlueprint = item.item_id === 'blueprint';
          const commanderGear = canEquipOnCommander(item.item_id, items);
          const troopGear = canEquipOnUnit(item.item_id, items);

          return (
            <div
              key={item.id}
              className={`theme-card p-3 ${getRarityClass(item.rarity)} ${item.equipped_to_unit || item.equipped_to_commander ? 'opacity-80' : ''}`}
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
              {equippedName && (
                <div className="text-[10px] text-green-400 mb-1">✓ Equipped on {equippedName}</div>
              )}
              {item.equipped_to_commander && (
                <div className="text-[10px] text-blue-400 mb-1">✓ Commander gear</div>
              )}
              {def?.description && (
                <p className="text-[10px] opacity-50 mb-1 line-clamp-2">{def.description}</p>
              )}
              {Object.entries(item.stats).map(([k, v]) => (
                <div key={k} className="text-xs opacity-60">{k}: +{v}</div>
              ))}
              <div className="text-xs opacity-50 mt-1">Sell: {sellPrice}🪙</div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {isBlueprint && !item.equipped_to_unit && !item.equipped_to_commander && (
                  <button onClick={() => redeemBlueprint(item.id)} className="theme-btn theme-btn-primary text-xs flex-1">
                    Redeem
                  </button>
                )}
                {!item.equipped_to_unit && !item.equipped_to_commander && (state.units.length > 0 || commanderGear) && !isBlueprint && (troopGear || commanderGear) && (
                  <button
                    onClick={() => setEquipTarget({
                      itemId: item.id, itemName: item.name, itemType: def?.item_type || 'weapon',
                      stats: item.stats, rarity: item.rarity,
                    })}
                    className="theme-btn text-xs flex-1"
                  >
                    Equip
                  </button>
                )}
                {!item.equipped_to_unit && !item.equipped_to_commander && (
                  <button onClick={() => sell(item.id)} className="theme-btn text-xs flex-1">Sell</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {equipTarget && (
        <GameModal title={`Equip ${equipTarget.itemName}`} onClose={() => setEquipTarget(null)}>
          {formatBonus(equipTarget.stats) && (
            <p className="text-xs opacity-70">Grants: {formatBonus(equipTarget.stats)}</p>
          )}
          {canEquipOnCommander(
            state.inventory.find((i) => i.id === equipTarget.itemId)?.item_id || '',
            items
          ) && (
            <button
              type="button"
              disabled={equipping}
              onClick={() => equipCommander(equipTarget.itemId, equipTarget.itemName, equipTarget.rarity)}
              className="theme-btn theme-btn-primary w-full text-sm py-2 mb-3"
            >
              ⭐ Equip on Commander
            </button>
          )}
          {state.units.length > 0 && canEquipOnUnit(
            state.inventory.find((i) => i.id === equipTarget.itemId)?.item_id || '',
            items
          ) && (
            <>
              <p className="text-xs opacity-50">Or equip on a troop:</p>
              <div className="space-y-2">
                {state.units.map((u) => {
                  const def = state.config.units.find((x) => x.key === u.unit_key);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      disabled={equipping}
                      onClick={() => equipTroop(equipTarget.itemId, u.id, equipTarget.itemName, equipTarget.stats, equipTarget.rarity)}
                      className="theme-btn w-full text-sm py-2 flex items-center justify-center gap-2"
                    >
                      {def?.icon} {def?.name || u.unit_key}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </GameModal>
      )}

      {infoItem && <ItemInfoModal item={infoItem} onClose={() => setInfoItem(null)} />}
    </div>
  );
}
