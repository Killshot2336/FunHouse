export type ResourceKey = 'gold' | 'materials' | 'food' | 'faction_currency';

export interface TradeResources {
  gold?: number;
  materials?: number;
  food?: number;
  faction_currency?: number;
  item_ids?: string[];
  description?: string;
}

export interface CommanderResources {
  gold: number;
  materials: number;
  food: number;
  faction_currency: number;
}

export const RESOURCE_META: Record<ResourceKey, { icon: string; label: string }> = {
  gold: { icon: '🪙', label: 'Gold' },
  materials: { icon: '⛏️', label: 'Materials' },
  food: { icon: '🌾', label: 'Food' },
  faction_currency: { icon: '⭐', label: 'Faction' },
};

export function getCommanderResource(cmd: CommanderResources, key: ResourceKey): number {
  return cmd[key] ?? 0;
}

export function hasEnoughResources(cmd: CommanderResources, bundle: TradeResources): boolean {
  for (const key of Object.keys(RESOURCE_META) as ResourceKey[]) {
    const need = bundle[key] || 0;
    if (need > 0 && getCommanderResource(cmd, key) < need) return false;
  }
  return true;
}

export function applyResourceDelta(cmd: CommanderResources, delta: TradeResources, sign: 1 | -1): CommanderResources {
  const next = { ...cmd };
  for (const key of Object.keys(RESOURCE_META) as ResourceKey[]) {
    const amount = (delta[key] || 0) * sign;
    if (amount !== 0) next[key] = getCommanderResource(next, key) + amount;
  }
  return next;
}

export function deductResources(cmd: CommanderResources, cost: Partial<Record<ResourceKey, number>>): CommanderResources | null {
  for (const key of Object.keys(RESOURCE_META) as ResourceKey[]) {
    const need = cost[key] || 0;
    if (need > 0 && getCommanderResource(cmd, key) < need) return null;
  }
  const next = { ...cmd };
  for (const key of Object.keys(RESOURCE_META) as ResourceKey[]) {
    const amount = cost[key] || 0;
    if (amount > 0) next[key] -= amount;
  }
  return next;
}

export function tradeDescription(bundle: TradeResources): string {
  const parts = (Object.keys(RESOURCE_META) as ResourceKey[])
    .filter((k) => (bundle[k] || 0) > 0)
    .map((k) => `${bundle[k]} ${RESOURCE_META[k].icon}`);
  return parts.join(' + ') || 'items';
}
