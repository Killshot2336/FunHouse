import { SupabaseClient } from '@supabase/supabase-js';
import {
  PATRON_BY_USER,
  MISSIONS,
  STORY_INTROS,
  BUILDINGS,
  UNITS_BY_PATRON,
  buildingCost,
  statUpgradeCost,
  calcPowerRating,
  type Patron,
} from './gameConfig.js';
import {
  calcOfflineResources,
  calcBuildingAccrued,
  rollLoot,
  defaultUnitStats,
  type BuildingState,
} from './gameEngine.js';
import {
  type TradeResources,
  hasEnoughResources,
  applyResourceDelta,
  tradeDescription,
} from './tradeResources.js';

export interface Commander {
  user_id: string;
  patron: string;
  gold: number;
  materials: number;
  food: number;
  faction_currency: number;
  village_level: number;
  power_rating: number;
  story_chapter: number;
  story_seen: boolean;
  grid_size: number;
  last_seen_at: string;
}

export interface Building {
  id: string;
  user_id: string;
  building_key: string;
  grid_x: number;
  grid_y: number;
  level: number;
}

export interface Unit {
  id: string;
  user_id: string;
  unit_key: string;
  slot_index: number;
  stats: { atk: number; def: number; spd: number; luck: number };
  cosmetics: { armor: string; aura: string; weapon: string; banner: string };
  equipment: Record<string, string | null>;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  name: string;
  rarity: string;
  stats: Record<string, number>;
  quantity: number;
  equipped_to_unit: string | null;
}

function mapUnit(row: Record<string, unknown>): Unit {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    unit_key: row.unit_key as string,
    slot_index: row.slot_index as number,
    stats: (row.stats_json || defaultUnitStats()) as Unit['stats'],
    cosmetics: (row.cosmetics_json || { armor: 'default', aura: 'none', weapon: 'basic', banner: 'standard' }) as Unit['cosmetics'],
    equipment: (row.equipment_json || { weapon: null, armor: null, aura: null, relic: null }) as Unit['equipment'],
  };
}

function mapInventory(row: Record<string, unknown>): InventoryItem {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    item_id: row.item_id as string,
    name: row.name as string,
    rarity: row.rarity as string,
    stats: (row.stats_json || {}) as Record<string, number>,
    quantity: (row.quantity as number) || 1,
    equipped_to_unit: (row.equipped_to_unit as string) || null,
  };
}

export async function getOrCreateCommander(sb: SupabaseClient, userId: string): Promise<Commander> {
  const { data } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();

  if (data) return data as Commander;

  const patron = PATRON_BY_USER[userId] || 'rick';
  const cmd: Commander = {
    user_id: userId,
    patron,
    gold: 100,
    materials: 50,
    food: 50,
    faction_currency: 0,
    village_level: 1,
    power_rating: 0,
    story_chapter: 0,
    story_seen: false,
    grid_size: 8,
    last_seen_at: new Date().toISOString(),
  };

  await sb.from('game_commanders').insert(cmd);

  const missions = MISSIONS.map((m) => ({
    user_id: userId,
    mission_key: m.key,
    status: 'active',
    progress: 0,
  }));
  await sb.from('game_missions').upsert(missions, { onConflict: 'user_id,mission_key' });
  await sb.from('game_drop_pity').upsert({ user_id: userId, rolls_since_rare: 0, rolls_since_legendary: 0 });

  return cmd;
}

export async function refreshPower(sb: SupabaseClient, userId: string): Promise<void> {
  const { data: units } = await sb.from('game_army_units').select('*').eq('user_id', userId);
  const { data: cmd } = await sb.from('game_commanders').select('village_level').eq('user_id', userId).single();
  if (!cmd) return;

  const mapped = (units || []).map(mapUnit);
  const power = calcPowerRating(mapped, cmd.village_level);
  await sb.from('game_commanders').update({ power_rating: power }).eq('user_id', userId);
}

export async function applyOffline(sb: SupabaseClient, userId: string): Promise<Commander> {
  const cmd = await getOrCreateCommander(sb, userId);
  const { data: buildings } = await sb.from('game_village_buildings').select('*').eq('user_id', userId);

  const offline = calcOfflineResources(
    (buildings || []) as BuildingState[],
    cmd.last_seen_at
  );

  const updated = {
    gold: cmd.gold + offline.gold,
    materials: cmd.materials + offline.materials,
    food: cmd.food + offline.food,
    faction_currency: cmd.faction_currency + offline.faction,
    last_seen_at: new Date().toISOString(),
  };

  await sb.from('game_commanders').update(updated).eq('user_id', userId);
  return { ...cmd, ...updated };
}

export async function getGameState(sb: SupabaseClient, userId: string) {
  const commander = await applyOffline(sb, userId);
  await refreshPower(sb, userId);

  const { data: refreshed } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
  const cmd = (refreshed || commander) as Commander;

  const [buildingsRes, unitsRes, inventoryRes, missionsRes, pityRes, patrolsRes] = await Promise.all([
    sb.from('game_village_buildings').select('*').eq('user_id', userId),
    sb.from('game_army_units').select('*').eq('user_id', userId).order('slot_index'),
    sb.from('game_inventory').select('*').eq('user_id', userId),
    sb.from('game_missions').select('*').eq('user_id', userId),
    sb.from('game_drop_pity').select('*').eq('user_id', userId).single(),
    sb.from('game_patrols').select('*').eq('user_id', userId).is('result_json', null),
  ]);

  return {
    commander: cmd,
    buildings: buildingsRes.data || [],
    building_accrued: calcBuildingAccrued((buildingsRes.data || []) as BuildingState[], cmd.last_seen_at),
    units: (unitsRes.data || []).map(mapUnit),
    inventory: (inventoryRes.data || []).map(mapInventory),
    missions: missionsRes.data || [],
    pity: pityRes.data || { rolls_since_rare: 0, rolls_since_legendary: 0 },
    patrols: patrolsRes.data || [],
    story: STORY_INTROS[cmd.patron as Patron],
    config: {
      buildings: BUILDINGS,
      units: UNITS_BY_PATRON[cmd.patron as Patron],
      missions: MISSIONS,
    },
  };
}

export async function updateMissionProgress(
  sb: SupabaseClient,
  userId: string,
  type: string,
  value: number,
  building?: string
): Promise<void> {
  for (const m of MISSIONS) {
    if (m.type !== type) continue;
    if (m.type === 'building' && 'building' in m && m.building !== building) continue;

    const { data: mission } = await sb
      .from('game_missions')
      .select('*')
      .eq('user_id', userId)
      .eq('mission_key', m.key)
      .single();

    if (!mission || mission.status === 'completed') continue;

    const progress = Math.max(mission.progress, value);
    const updates: Record<string, unknown> = { progress };

    if (progress >= m.target) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
      if (m.reward) {
        const cmd = await getOrCreateCommander(sb, userId);
        await sb.from('game_commanders').update({
          gold: cmd.gold + (m.reward.gold || 0),
          materials: cmd.materials + (m.reward.materials || 0),
        }).eq('user_id', userId);
      }
    }

    await sb.from('game_missions').update(updates).eq('user_id', userId).eq('mission_key', m.key);
  }
}

export async function placeBuilding(
  sb: SupabaseClient,
  userId: string,
  building_key: string,
  grid_x: number,
  grid_y: number
) {
  const cmd = await getOrCreateCommander(sb, userId);

  const { data: existing } = await sb
    .from('game_village_buildings')
    .select('*')
    .eq('user_id', userId)
    .eq('grid_x', grid_x)
    .eq('grid_y', grid_y)
    .single();

  if (existing) {
    const cost = buildingCost(existing.building_key, existing.level);
    if (cmd.gold < cost) throw new Error('Not enough gold');

    const newLevel = existing.level + 1;
    await sb.from('game_commanders').update({
      gold: cmd.gold - cost,
      village_level: Math.max(cmd.village_level, newLevel),
    }).eq('user_id', userId);

    const { data: building } = await sb
      .from('game_village_buildings')
      .update({ level: newLevel })
      .eq('id', existing.id)
      .select()
      .single();

    await updateMissionProgress(sb, userId, 'building', newLevel, existing.building_key);
    await refreshPower(sb, userId);

    const { data: updatedCmd } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
    return { building, commander: updatedCmd };
  }

  const cost = buildingCost(building_key, 0);
  if (cmd.gold < cost) throw new Error('Not enough gold');
  if (grid_x >= cmd.grid_size || grid_y >= cmd.grid_size) throw new Error('Out of bounds');

  await sb.from('game_commanders').update({ gold: cmd.gold - cost }).eq('user_id', userId);

  const { data: building } = await sb
    .from('game_village_buildings')
    .insert({ user_id: userId, building_key, grid_x, grid_y, level: 1 })
    .select()
    .single();

  const { count } = await sb
    .from('game_village_buildings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  await updateMissionProgress(sb, userId, 'build', count || 1);
  await refreshPower(sb, userId);

  const { data: updatedCmd } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
  return { building, commander: updatedCmd };
}

export async function recruitUnit(sb: SupabaseClient, userId: string, unit_key: string) {
  const cmd = await getOrCreateCommander(sb, userId);
  const patron = cmd.patron as Patron;
  const unitDef = UNITS_BY_PATRON[patron]?.find((u) => u.key === unit_key);
  if (!unitDef) throw new Error('Invalid unit');

  const { count } = await sb
    .from('game_army_units')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if ((count || 0) >= 6) throw new Error('Army full (max 6)');
  if (cmd.gold < unitDef.baseCost) throw new Error('Not enough gold');

  await sb.from('game_commanders').update({ gold: cmd.gold - unitDef.baseCost }).eq('user_id', userId);

  const { data: unit } = await sb
    .from('game_army_units')
    .insert({
      user_id: userId,
      unit_key,
      slot_index: count || 0,
      stats_json: defaultUnitStats(),
      cosmetics_json: { armor: 'default', aura: 'none', weapon: 'basic', banner: 'standard' },
      equipment_json: { weapon: null, armor: null, aura: null, relic: null },
    })
    .select()
    .single();

  await updateMissionProgress(sb, userId, 'recruit', (count || 0) + 1);
  await refreshPower(sb, userId);

  const { data: updatedCmd } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
  return { unit: mapUnit(unit!), commander: updatedCmd };
}

export async function upgradeUnit(sb: SupabaseClient, userId: string, unitId: string, stat: string) {
  if (!['atk', 'def', 'spd', 'luck'].includes(stat)) throw new Error('Invalid stat');

  const { data: unitRow } = await sb
    .from('game_army_units')
    .select('*')
    .eq('id', unitId)
    .eq('user_id', userId)
    .single();

  if (!unitRow) throw new Error('Unit not found');

  const unit = mapUnit(unitRow);
  const level = unit.stats[stat as keyof typeof unit.stats];
  const cost = statUpgradeCost(level);
  const cmd = await getOrCreateCommander(sb, userId);

  if (cmd.gold < cost || cmd.materials < Math.floor(cost / 2)) {
    throw new Error('Not enough resources');
  }

  unit.stats[stat as keyof typeof unit.stats] += 1;

  await sb.from('game_commanders').update({
    gold: cmd.gold - cost,
    materials: cmd.materials - Math.floor(cost / 2),
  }).eq('user_id', userId);

  const { data: updated } = await sb
    .from('game_army_units')
    .update({ stats_json: unit.stats })
    .eq('id', unitId)
    .select()
    .single();

  await updateMissionProgress(sb, userId, 'upgrade', 1);
  await refreshPower(sb, userId);

  const { data: updatedCmd } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
  return { unit: mapUnit(updated!), commander: updatedCmd };
}

export async function updateUnitCosmetics(
  sb: SupabaseClient,
  userId: string,
  unitId: string,
  cosmetics: Record<string, string>
) {
  const { data: unitRow } = await sb
    .from('game_army_units')
    .select('*')
    .eq('id', unitId)
    .eq('user_id', userId)
    .single();

  if (!unitRow) throw new Error('Unit not found');

  const unit = mapUnit(unitRow);
  unit.cosmetics = { ...unit.cosmetics, ...cosmetics };

  const { data: updated } = await sb
    .from('game_army_units')
    .update({ cosmetics_json: unit.cosmetics })
    .eq('id', unitId)
    .select()
    .single();

  return { unit: mapUnit(updated!) };
}

export async function startPatrol(sb: SupabaseClient, userId: string) {
  const { data: active } = await sb
    .from('game_patrols')
    .select('*')
    .eq('user_id', userId)
    .is('result_json', null)
    .maybeSingle();

  if (active) throw new Error('Patrol already active');

  const completes = new Date(Date.now() + 30000).toISOString();
  const { data: patrol } = await sb
    .from('game_patrols')
    .insert({
      user_id: userId,
      completes_at: completes,
    })
    .select()
    .single();

  return { patrol };
}

export async function claimPatrol(sb: SupabaseClient, userId: string, patrolId: string) {
  const { data: patrol } = await sb
    .from('game_patrols')
    .select('*')
    .eq('id', patrolId)
    .eq('user_id', userId)
    .single();

  if (!patrol) throw new Error('Patrol not found');
  if (new Date(patrol.completes_at) > new Date()) throw new Error('Patrol not complete');
  if (patrol.result_json) throw new Error('Already claimed');

  const { data: pityRow } = await sb.from('game_drop_pity').select('*').eq('user_id', userId).single();
  let pity = pityRow || { rolls_since_rare: 0, rolls_since_legendary: 0 };

  const drops: InventoryItem[] = [];
  const numRolls = 1 + Math.floor(Math.random() * 2);

  for (let i = 0; i < numRolls; i++) {
    const { item, newPity } = rollLoot(pity);
    pity = newPity;

    const { data: inv } = await sb
      .from('game_inventory')
      .insert({
        user_id: userId,
        item_id: item.id,
        name: item.name,
        rarity: item.rarity,
        stats_json: item.stats,
        quantity: 1,
      })
      .select()
      .single();

    drops.push(mapInventory(inv!));
  }

  await sb.from('game_drop_pity').upsert({
    user_id: userId,
    rolls_since_rare: pity.rolls_since_rare,
    rolls_since_legendary: pity.rolls_since_legendary,
  });

  const cmd = await getOrCreateCommander(sb, userId);
  const goldGain = 10 + Math.floor(Math.random() * 20);
  await sb.from('game_commanders').update({ gold: cmd.gold + goldGain }).eq('user_id', userId);
  await sb.from('game_patrols').update({ result_json: { drops } }).eq('id', patrolId);
  await updateMissionProgress(sb, userId, 'patrol', 1);

  const { data: updatedCmd } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
  return { drops, commander: updatedCmd, pity };
}

export async function equipItem(
  sb: SupabaseClient,
  userId: string,
  itemId: string,
  unit_id: string,
  slot: string
) {
  const { data: itemRow } = await sb.from('game_inventory').select('*').eq('id', itemId).eq('user_id', userId).single();
  const { data: unitRow } = await sb.from('game_army_units').select('*').eq('id', unit_id).eq('user_id', userId).single();

  if (!itemRow || !unitRow) throw new Error('Not found');
  if (itemRow.equipped_to_unit) throw new Error('Already equipped');

  const unit = mapUnit(unitRow);
  const item = mapInventory(itemRow);

  for (const [k, v] of Object.entries(item.stats)) {
    if (k in unit.stats) unit.stats[k as keyof typeof unit.stats] += v;
  }
  unit.equipment[slot] = itemId;

  await sb.from('game_inventory').update({ equipped_to_unit: unit_id }).eq('id', itemId);
  await sb.from('game_army_units').update({
    stats_json: unit.stats,
    equipment_json: unit.equipment,
  }).eq('id', unit_id);

  await refreshPower(sb, userId);
  return { item: { ...item, equipped_to_unit: unit_id }, unit };
}

export async function sellItem(sb: SupabaseClient, userId: string, itemId: string) {
  const { data: itemRow } = await sb.from('game_inventory').select('*').eq('id', itemId).eq('user_id', userId).single();
  if (!itemRow) throw new Error('Not found');
  if (itemRow.equipped_to_unit) throw new Error('Unequip first');

  const sellValues: Record<string, number> = {
    common: 5, uncommon: 25, rare: 75, epic: 200, legendary: 500, mythic: 2000,
  };

  const cmd = await getOrCreateCommander(sb, userId);
  await sb.from('game_commanders').update({
    gold: cmd.gold + (sellValues[itemRow.rarity] || 5),
  }).eq('user_id', userId);

  await sb.from('game_inventory').delete().eq('id', itemId);

  const { data: updatedCmd } = await sb.from('game_commanders').select('*').eq('user_id', userId).single();
  return { commander: updatedCmd };
}

export async function getTrades(sb: SupabaseClient, userId: string) {
  const { data } = await sb
    .from('game_trades')
    .select('*')
    .eq('status', 'pending')
    .or(`to_user.eq.${userId},from_user.eq.${userId}`);

  return data || [];
}

export async function createTrade(
  sb: SupabaseClient,
  fromUser: string,
  to_user: string,
  offer: TradeResources,
  request: TradeResources
) {
  const fromCmd = await getOrCreateCommander(sb, fromUser);
  if (!hasEnoughResources(fromCmd, offer)) throw new Error('Not enough resources to offer');

  const { data: trade } = await sb
    .from('game_trades')
    .insert({
      from_user: fromUser,
      to_user,
      offer_json: { ...offer, description: tradeDescription(offer) },
      request_json: { ...request, description: tradeDescription(request) },
    })
    .select()
    .single();

  return trade;
}

export async function acceptTrade(sb: SupabaseClient, userId: string, tradeId: string) {
  const { data: trade } = await sb
    .from('game_trades')
    .select('*')
    .eq('id', tradeId)
    .eq('to_user', userId)
    .eq('status', 'pending')
    .single();

  if (!trade) throw new Error('Trade not found');

  const offer = trade.offer_json as TradeResources;
  const request = trade.request_json as TradeResources;

  const fromCmd = await getOrCreateCommander(sb, trade.from_user);
  const toCmd = await getOrCreateCommander(sb, trade.to_user);

  if (!hasEnoughResources(fromCmd, offer)) throw new Error('Offerer lacks resources');
  if (!hasEnoughResources(toCmd, request)) throw new Error('You lack requested resources');

  const newFrom = applyResourceDelta(applyResourceDelta(fromCmd, offer, -1), request, 1);
  const newTo = applyResourceDelta(applyResourceDelta(toCmd, request, -1), offer, 1);

  await sb.from('game_commanders').update({
    gold: newFrom.gold,
    materials: newFrom.materials,
    food: newFrom.food,
    faction_currency: newFrom.faction_currency,
  }).eq('user_id', trade.from_user);

  await sb.from('game_commanders').update({
    gold: newTo.gold,
    materials: newTo.materials,
    food: newTo.food,
    faction_currency: newTo.faction_currency,
  }).eq('user_id', trade.to_user);

  if (offer.item_ids) {
    for (const id of offer.item_ids) {
      await sb.from('game_inventory').update({ user_id: trade.to_user }).eq('id', id).eq('user_id', trade.from_user);
    }
  }
  if (request.item_ids) {
    for (const id of request.item_ids) {
      await sb.from('game_inventory').update({ user_id: trade.from_user }).eq('id', id).eq('user_id', trade.to_user);
    }
  }

  await sb.from('game_trades').update({ status: 'accepted' }).eq('id', tradeId);
  return { trade: { ...trade, status: 'accepted' }, success: true };
}

export async function getLeaderboard(sb: SupabaseClient) {
  const { data } = await sb.from('game_commanders').select('user_id, power_rating, village_level, gold');
  const board = ['aden', 'edward', 'jamie'].map((uid) => {
    const cmd = data?.find((c) => c.user_id === uid);
    return {
      user_id: uid,
      power_rating: cmd?.power_rating || 0,
      village_level: cmd?.village_level || 0,
      gold: cmd?.gold || 0,
    };
  }).sort((a, b) => b.power_rating - a.power_rating);

  return board;
}
