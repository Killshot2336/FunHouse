import { Router, Request, Response } from 'express';
import { isDemoMode, supabase } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';
import {
  PATRON_BY_USER,
  BUILDINGS,
  UNITS_BY_PATRON,
  MISSIONS,
  STORY_INTROS,
  LOOT_TABLE,
  CROP_TYPES,
  ORE_TYPES,
  BUILDING_UPGRADE_TREES,
  GAME_GUIDE,
  buildingCost,
  statUpgradeCost,
  calcPowerRating,
  PACK_TYPES,
  SKILL_BRANCHES,
  SKILL_NODE_BONUS,
  skillNodeCost,
  expandGridCost,
  ZONE_TYPES,
  isValidBuildingKey,
  getUnlockedCrops,
  getPickaxeTier,
  type Patron,
  type PackType,
  type SkillBranch,
} from '../lib/gameConfig.js';
import {
  calcOfflineResources,
  calcBuildingAccrued,
  calcStockpileAccrual,
  mergeStockpile,
  rollLoot,
  rollPackUnit,
  defaultUnitStats,
} from '../lib/gameEngine.js';
import {
  itemSellPrice,
  getCropPrices,
  getOrePrices,
  getHotCrop,
  marketResetsAt,
  dungeonResetsAt,
  getDungeonSeed,
  generateDungeonRooms,
  rollOres,
  defaultBuildingMeta,
  upgradeSlotCost,
  parseStockpile,
} from '../lib/economyEngine.js';
import { unitCombatPower, rollDuelStakes, applyZoneYield, deductCommanderResources, addCommanderResources } from '../lib/progressEngine.js';
import { awardXpDemo } from './progress.js';
import * as gameDb from '../lib/gameSupabase.js';
import {
  type TradeResources,
  type CommanderResources,
  hasEnoughResources,
  applyResourceDelta,
  deductResources,
  tradeDescription,
  hasTradeContent,
} from '../lib/tradeResources.js';

const router = Router();
router.use(authMiddleware);

function getOrCreateCommander(store: ReturnType<typeof getDemoStore>, userId: string) {
  let cmd = store.gameCommanders.find((c) => c.user_id === userId);
  if (!cmd) {
    const patron = PATRON_BY_USER[userId] || 'rick';
    cmd = {
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
      stockpile_json: parseStockpile(null),
      pickaxe_tier: 1,
    };
    store.gameCommanders.push(cmd);
    for (const m of MISSIONS) {
      store.gameMissions.push({ user_id: userId, mission_key: m.key, status: 'active', progress: 0 });
    }
    store.gamePity.push({ user_id: userId, rolls_since_rare: 0, rolls_since_legendary: 0 });
  }
  return cmd;
}

function refreshPower(store: ReturnType<typeof getDemoStore>, userId: string) {
  const cmd = store.gameCommanders.find((c) => c.user_id === userId);
  if (!cmd) return;
  const units = store.gameUnits.filter((u) => u.user_id === userId);
  cmd.power_rating = calcPowerRating(units, cmd.village_level);
}

function applyOffline(store: ReturnType<typeof getDemoStore>, userId: string) {
  const cmd = getOrCreateCommander(store, userId);
  const buildings = store.gameBuildings.filter((b) => b.user_id === userId);
  const offline = calcOfflineResources(buildings, cmd.last_seen_at);
  const stockpileAccrual = calcStockpileAccrual(buildings, cmd.last_seen_at);
  cmd.gold += offline.gold;
  cmd.materials += offline.materials;
  cmd.food += offline.food;
  cmd.faction_currency += offline.faction;
  cmd.stockpile_json = mergeStockpile(cmd.stockpile_json, stockpileAccrual);
  cmd.last_seen_at = new Date().toISOString();
}

function buildDemoMarket() {
  const hourSeed = Math.floor(Date.now() / 3600000);
  return {
    crop_prices: getCropPrices(hourSeed),
    ore_prices: getOrePrices(hourSeed),
    hot_crop: getHotCrop(hourSeed),
    market_resets_at: marketResetsAt(),
    dungeon_seed: getDungeonSeed(),
    dungeon_resets_at: dungeonResetsAt(),
  };
}

function handleGameError(res: Response, err: unknown) {
  const message = err instanceof Error ? err.message : 'Request failed';
  const status = message.includes('Not found') ? 404 : 400;
  return res.status(status).json({ error: message });
}

function buildAccruedPayload(store: ReturnType<typeof getDemoStore>, userId: string) {
  const cmd = store.gameCommanders.find((c) => c.user_id === userId);
  if (!cmd) return [];
  const buildings = store.gameBuildings.filter((b) => b.user_id === userId);
  return calcBuildingAccrued(buildings, cmd.last_seen_at);
}

router.get('/state', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    refreshPower(store, user.username);
    return res.json({
      commander: cmd,
      buildings: store.gameBuildings.filter((b) => b.user_id === user.username),
      building_accrued: buildAccruedPayload(store, user.username),
      units: store.gameUnits.filter((u) => u.user_id === user.username),
      inventory: store.gameInventory.filter((i) => i.user_id === user.username),
      missions: store.gameMissions.filter((m) => m.user_id === user.username),
      pity: store.gamePity.find((p) => p.user_id === user.username) || { rolls_since_rare: 0, rolls_since_legendary: 0 },
      patrols: store.gamePatrols.filter((p) => p.user_id === user.username && !p.result_json),
      story: STORY_INTROS[cmd.patron as Patron],
      market: buildDemoMarket(),
      config: {
        buildings: BUILDINGS,
        units: UNITS_BY_PATRON[cmd.patron as Patron],
        missions: MISSIONS,
        packs: PACK_TYPES,
        items: LOOT_TABLE,
        crops: CROP_TYPES,
        ores: ORE_TYPES,
        upgrade_trees: BUILDING_UPGRADE_TREES,
        guide: GAME_GUIDE,
      },
    });
  }

  try {
    const state = await gameDb.getGameState(supabase, user.username);
    res.json(state);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/story-seen', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    cmd.story_seen = true;
    return res.json({ success: true });
  }

  await supabase.from('game_commanders').update({ story_seen: true }).eq('user_id', user.username);
  res.json({ success: true });
});

router.post('/build', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { building_key, grid_x, grid_y } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const existing = store.gameBuildings.find(
      (b) => b.user_id === user.username && b.grid_x === grid_x && b.grid_y === grid_y
    );

    if (existing) {
      const cost = buildingCost(existing.building_key, existing.level);
      if (cmd.gold < cost) return res.status(400).json({ error: 'Not enough gold' });
      cmd.gold -= cost;
      existing.level += 1;
      cmd.village_level = Math.max(cmd.village_level, existing.level);
      refreshPower(store, user.username);
      updateMissionProgress(store, user.username, 'building', existing.level, existing.building_key);
      return res.json({ building: existing, commander: cmd });
    }

    const cost = buildingCost(building_key, 0);
    if (cmd.gold < cost) return res.status(400).json({ error: 'Not enough gold' });
    if (grid_x >= cmd.grid_size || grid_y >= cmd.grid_size) return res.status(400).json({ error: 'Out of bounds' });
    if (!isValidBuildingKey(building_key)) return res.status(400).json({ error: 'Invalid building type' });

    cmd.gold -= cost;
    const building = {
      id: uuid(),
      user_id: user.username,
      building_key,
      grid_x,
      grid_y,
      level: 1,
      building_meta_json: defaultBuildingMeta(building_key),
    };
    store.gameBuildings.push(building);
    const buildCount = store.gameBuildings.filter((b) => b.user_id === user.username).length;
    updateMissionProgress(store, user.username, 'build', buildCount);
    refreshPower(store, user.username);
    return res.json({ building, commander: cmd });
  }

  try {
    const result = await gameDb.placeBuilding(supabase, user.username, building_key, grid_x, grid_y);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/recruit', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { unit_key } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const patron = cmd.patron as Patron;
    const unitDef = UNITS_BY_PATRON[patron]?.find((u) => u.key === unit_key);
    if (!unitDef) return res.status(400).json({ error: 'Invalid unit' });

    const units = store.gameUnits.filter((u) => u.user_id === user.username);
    if (units.length >= 6) return res.status(400).json({ error: 'Army full (max 6)' });
    if (cmd.gold < unitDef.baseCost) return res.status(400).json({ error: 'Not enough gold' });

    cmd.gold -= unitDef.baseCost;
    const slot = units.length;
    const unit = {
      id: uuid(),
      user_id: user.username,
      unit_key,
      slot_index: slot,
      stats: defaultUnitStats(),
      cosmetics: { armor: 'default', aura: 'none', weapon: 'basic', banner: 'standard' },
      equipment: { weapon: null, armor: null, aura: null, relic: null },
    };
    store.gameUnits.push(unit);
    updateMissionProgress(store, user.username, 'recruit', units.length + 1);
    refreshPower(store, user.username);
    return res.json({ unit, commander: cmd });
  }

  try {
    const result = await gameDb.recruitUnit(supabase, user.username, unit_key);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/units/:id/upgrade', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { stat } = req.body;
  const unitId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const unit = store.gameUnits.find((u) => u.id === unitId && u.user_id === user.username);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    if (!['atk', 'def', 'spd', 'luck'].includes(stat)) return res.status(400).json({ error: 'Invalid stat' });

    const stats = unit.stats as Record<string, number>;
    const level = Number(stats[stat] ?? 0);
    const cost = statUpgradeCost(level);
    if (cmd.gold < cost || cmd.materials < Math.floor(cost / 2)) {
      return res.status(400).json({ error: 'Not enough resources' });
    }
    cmd.gold -= cost;
    cmd.materials -= Math.floor(cost / 2);
    stats[stat] = level + 1;
    unit.stats = stats;
    updateMissionProgress(store, user.username, 'upgrade', 1);
    refreshPower(store, user.username);
    return res.json({ unit, commander: cmd });
  }

  try {
    const result = await gameDb.upgradeUnit(supabase, user.username, unitId, stat);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.patch('/units/:id/cosmetics', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const unitId = String(req.params.id);
  const { cosmetics } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const unit = store.gameUnits.find((u) => u.id === unitId && u.user_id === user.username);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    unit.cosmetics = { ...unit.cosmetics, ...cosmetics };
    return res.json({ unit });
  }

  try {
    const result = await gameDb.updateUnitCosmetics(supabase, user.username, unitId, cosmetics);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/patrol', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const active = store.gamePatrols.find((p) => p.user_id === user.username && !p.result_json);
    if (active) return res.status(400).json({ error: 'Patrol already active' });

    const completes = new Date(Date.now() + 30000).toISOString();
    const patrol = { id: uuid(), user_id: user.username, started_at: new Date().toISOString(), completes_at: completes, result_json: null };
    store.gamePatrols.push(patrol);
    return res.json({ patrol });
  }

  try {
    const result = await gameDb.startPatrol(supabase, user.username);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/patrol/:id/claim', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const patrolId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const patrol = store.gamePatrols.find((p) => p.id === patrolId && p.user_id === user.username);
    if (!patrol) return res.status(404).json({ error: 'Patrol not found' });
    if (new Date(patrol.completes_at) > new Date()) return res.status(400).json({ error: 'Patrol not complete' });
    if (patrol.result_json) return res.status(400).json({ error: 'Already claimed' });

    let pity = store.gamePity.find((p) => p.user_id === user.username);
    if (!pity) { pity = { user_id: user.username, rolls_since_rare: 0, rolls_since_legendary: 0 }; store.gamePity.push(pity); }

    const drops = [];
    const numRolls = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numRolls; i++) {
      const { item, newPity } = rollLoot(pity);
      pity.rolls_since_rare = newPity.rolls_since_rare;
      pity.rolls_since_legendary = newPity.rolls_since_legendary;
      const inv = {
        id: uuid(),
        user_id: user.username,
        item_id: item.id,
        name: item.name,
        rarity: item.rarity,
        stats: item.stats,
        quantity: 1,
        equipped_to_unit: null,
      };
      store.gameInventory.push(inv);
      drops.push(inv);
    }

    const cmd = getOrCreateCommander(store, user.username);
    cmd.gold += 10 + Math.floor(Math.random() * 20);
    patrol.result_json = { drops };
    updateMissionProgress(store, user.username, 'patrol', 1);
    return res.json({ drops, commander: cmd, pity });
  }

  try {
    const result = await gameDb.claimPatrol(supabase, user.username, patrolId);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/inventory/:id/equip', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { unit_id, slot } = req.body;
  const itemId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const item = store.gameInventory.find((i) => i.id === itemId && i.user_id === user.username);
    const unit = store.gameUnits.find((u) => u.id === unit_id && u.user_id === user.username);
    if (!item || !unit) return res.status(404).json({ error: 'Not found' });
    if (item.equipped_to_unit) return res.status(400).json({ error: 'Already equipped' });

    item.equipped_to_unit = unit_id;
    unit.equipment[slot] = item.id;
    const ustats = unit.stats as Record<string, number>;
    for (const [k, v] of Object.entries(item.stats)) {
      if (k in ustats) ustats[k] = Number(ustats[k] ?? 0) + v;
    }
    unit.stats = ustats;
    refreshPower(store, user.username);
    return res.json({ item, unit });
  }

  try {
    const result = await gameDb.equipItem(supabase, user.username, itemId, unit_id, slot);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/inventory/:id/sell', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const itemId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const idx = store.gameInventory.findIndex((i) => i.id === itemId && i.user_id === user.username);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    const item = store.gameInventory[idx];
    if (item.equipped_to_unit) return res.status(400).json({ error: 'Unequip first' });

    const price = itemSellPrice(item.item_id, item.rarity);
    const cmd = getOrCreateCommander(store, user.username);
    cmd.gold += price;
    store.gameInventory.splice(idx, 1);
    return res.json({ commander: cmd, sell_price: price });
  }

  try {
    const result = await gameDb.sellItem(supabase, user.username, itemId);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/collect', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    applyOffline(store, user.username);
    const cmd = getOrCreateCommander(store, user.username);
    return res.json({ commander: cmd });
  }

  try {
    const cmd = await gameDb.applyOffline(supabase, user.username);
    res.json({ commander: cmd });
  } catch (err) {
    handleGameError(res, err);
  }
});

router.get('/trades', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const trades = store.gameTrades.filter(
      (t) => (t.to_user === user.username || t.from_user === user.username) && t.status === 'pending'
    );
    return res.json(trades);
  }

  const trades = await gameDb.getTrades(supabase, user.username);
  res.json(trades);
});

router.post('/trades', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { to_user, offer, request } = req.body;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const fromCmd = getOrCreateCommander(store, user.username);
    const offerBundle = offer as TradeResources;
    const requestBundle = request as TradeResources;
    if (!hasTradeContent(offerBundle) && !hasTradeContent(requestBundle)) {
      return res.status(400).json({ error: 'Trade must include something to offer or request' });
    }
    if (hasTradeContent(offerBundle) && !hasEnoughResources(fromCmd, offerBundle)) {
      return res.status(400).json({ error: 'Not enough resources to offer' });
    }
    const trade = {
      id: uuid(), from_user: user.username, to_user,
      offer_json: { ...offerBundle, description: tradeDescription(offerBundle) },
      request_json: { ...requestBundle, description: tradeDescription(requestBundle) },
      status: 'pending', created_at: new Date().toISOString(),
    };
    store.gameTrades.push(trade);
    return res.json(trade);
  }

  const trade = await gameDb.createTrade(supabase, user.username, to_user, offer, request);
  res.json(trade);
});

router.post('/trades/:id/accept', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const tradeId = String(req.params.id);
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const trade = store.gameTrades.find((t) => t.id === tradeId && t.to_user === user.username && t.status === 'pending');
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const offer = trade.offer_json as TradeResources;
    const request = trade.request_json as TradeResources;
    const fromCmd = getOrCreateCommander(store, trade.from_user);
    const toCmd = getOrCreateCommander(store, trade.to_user);

    if (!hasEnoughResources(fromCmd, offer)) return res.status(400).json({ error: 'Offerer lacks resources' });
    if (hasTradeContent(request) && !hasEnoughResources(toCmd, request)) {
      return res.status(400).json({ error: 'You lack requested resources' });
    }

    const finalFrom = applyResourceDelta(applyResourceDelta(fromCmd, offer, -1), request, 1);
    const finalTo = applyResourceDelta(applyResourceDelta(toCmd, request, -1), offer, 1);
    fromCmd.gold = finalFrom.gold;
    fromCmd.materials = finalFrom.materials;
    fromCmd.food = finalFrom.food;
    fromCmd.faction_currency = finalFrom.faction_currency;
    toCmd.gold = finalTo.gold;
    toCmd.materials = finalTo.materials;
    toCmd.food = finalTo.food;
    toCmd.faction_currency = finalTo.faction_currency;

    if (offer.item_ids) {
      for (const id of offer.item_ids) {
        const item = store.gameInventory.find((i) => i.id === id && i.user_id === trade.from_user);
        if (item) item.user_id = trade.to_user;
      }
    }
    if (request.item_ids) {
      for (const id of request.item_ids) {
        const item = store.gameInventory.find((i) => i.id === id && i.user_id === trade.to_user);
        if (item) item.user_id = trade.from_user;
      }
    }

    trade.status = 'accepted';
    return res.json({ trade, success: true });
  }

  try {
    const result = await gameDb.acceptTrade(supabase, user.username, tradeId);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.get('/leaderboard', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const board = ['aden', 'edward', 'jamie'].map((uid) => {
      const cmd = store.gameCommanders.find((c) => c.user_id === uid);
      return {
        user_id: uid,
        power_rating: cmd?.power_rating || 0,
        village_level: cmd?.village_level || 0,
        gold: cmd?.gold || 0,
      };
    }).sort((a, b) => b.power_rating - a.power_rating);
    return res.json(board);
  }

  const board = await gameDb.getLeaderboard(supabase);
  res.json(board);
});

router.post('/packs/open', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { pack_type } = req.body as { pack_type: PackType };
  const pack = PACK_TYPES[pack_type];
  if (!pack) return res.status(400).json({ error: 'Invalid pack type' });

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const resCmd: CommanderResources = { gold: cmd.gold, materials: cmd.materials, food: cmd.food, faction_currency: cmd.faction_currency };
    const afterCost = deductResources(resCmd, pack.cost);
    if (!afterCost) return res.status(400).json({ error: 'Not enough resources' });
    cmd.gold = afterCost.gold;
    cmd.materials = afterCost.materials;
    cmd.food = afterCost.food;
    cmd.faction_currency = afterCost.faction_currency;

    let pity = store.gamePity.find((p) => p.user_id === user.username);
    if (!pity) { pity = { user_id: user.username, rolls_since_rare: 0, rolls_since_legendary: 0 }; store.gamePity.push(pity); }

    const rolled = rollPackUnit(cmd.patron as Patron, pity);
    pity.rolls_since_rare = rolled.newPity.rolls_since_rare;
    pity.rolls_since_legendary = rolled.newPity.rolls_since_legendary;

    const units = store.gameUnits.filter((u) => u.user_id === user.username);
    if (units.length >= 6) {
      cmd.gold += 50;
      return res.json({ full: true, refund: 50, roll: rolled, commander: cmd });
    }

    const unit = {
      id: uuid(),
      user_id: user.username,
      unit_key: rolled.unitKey,
      slot_index: units.length,
      rarity: rolled.rarity,
      stats: rolled.stats,
      cosmetics: { armor: 'default', aura: 'none', weapon: 'basic', banner: 'standard' },
      equipment: { weapon: null, armor: null, aura: null, relic: null },
    };
    store.gameUnits.push(unit);
    refreshPower(store, user.username);
    awardXpDemo(store, user.username, 'pack_open');
    return res.json({ unit, roll: rolled, commander: cmd, pity });
  }

  try {
    const result = await gameDb.openPack(supabase, user.username, pack_type);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

router.post('/units/:id/skill', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const unitId = String(req.params.id);
  const { branch, node } = req.body as { branch: SkillBranch; node: number };

  if (!SKILL_BRANCHES.includes(branch) || node < 1 || node > 5) {
    return res.status(400).json({ error: 'Invalid skill node' });
  }

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const unit = store.gameUnits.find((u) => u.id === unitId && u.user_id === user.username);
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const nodeKey = `${branch}_${node}`;
    const stats = unit.stats as Record<string, unknown>;
    const nodes = (stats.skill_nodes as string[]) || [];
    if (nodes.includes(nodeKey)) return res.status(400).json({ error: 'Already unlocked' });
    if (node > 1 && !nodes.includes(`${branch}_${node - 1}`)) {
      return res.status(400).json({ error: 'Unlock previous node first' });
    }

    const cost = skillNodeCost(branch, node);
    if (cmd.gold < cost.gold || cmd.materials < cost.materials) {
      return res.status(400).json({ error: 'Not enough resources' });
    }
    cmd.gold -= cost.gold;
    cmd.materials -= cost.materials;
    nodes.push(nodeKey);
    stats.skill_nodes = nodes;
    if (branch === 'health') stats.health = Number(stats.health ?? 50) + SKILL_NODE_BONUS.health;
    if (branch === 'damage') { stats.damage = Number(stats.damage ?? 10) + SKILL_NODE_BONUS.damage; stats.atk = stats.damage; }
    if (branch === 'shield') stats.shield = Number(stats.shield ?? 8) + SKILL_NODE_BONUS.shield;
    unit.stats = stats;

    refreshPower(store, user.username);
    return res.json({ unit, commander: cmd });
  }

  try {
    const result = await gameDb.unlockSkill(supabase, user.username, unitId, branch, node);
    res.json(result);
  } catch (err) {
    handleGameError(res, err);
  }
});

function updateMissionProgress(
  store: ReturnType<typeof getDemoStore>,
  userId: string,
  type: string,
  value: number,
  building?: string
) {
  for (const m of MISSIONS) {
    if (m.type !== type) continue;
    if (m.type === 'building' && 'building' in m && m.building !== building) continue;
    const mission = store.gameMissions.find((ms) => ms.user_id === userId && ms.mission_key === m.key);
    if (!mission || mission.status === 'completed') continue;
    mission.progress = Math.max(mission.progress, value);
    if (mission.progress >= m.target) {
      mission.status = 'completed';
      const cmd = store.gameCommanders.find((c) => c.user_id === userId);
      if (cmd && m.reward) {
        cmd.gold += m.reward.gold || 0;
        cmd.materials += m.reward.materials || 0;
      }
    }
  }
}

router.post('/expand-grid', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    if (cmd.grid_size >= 16) return res.status(400).json({ error: 'Max grid size reached' });
    const cost = expandGridCost(cmd.grid_size);
    if (cmd.gold < cost) return res.status(400).json({ error: 'Not enough gold' });
    cmd.gold -= cost;
    cmd.grid_size += 2;
    awardXpDemo(store, user.username, 'build');
    return res.json({ commander: cmd, cost });
  }
  try {
    const result = await gameDb.expandGrid(supabase, user.username);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.get('/zones', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const zones = store.gameZones.map((z) => ({
      ...z,
      deployments: store.gameZoneDeployments.filter((d) => d.zone_id === z.id).map((d) => ({
        user_id: d.user_id,
        unit_count: d.unit_ids.length,
      })),
      hidden_power: true,
    }));
    return res.json({ zones, zone_types: ZONE_TYPES });
  }
  try {
    const result = await gameDb.getZones(supabase, user.username);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/zones/:id/deploy', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const zoneId = String(req.params.id);
  const { unit_ids } = req.body as { unit_ids: string[] };

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const zone = store.gameZones.find((z) => z.id === zoneId);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    const units = store.gameUnits.filter((u) => unit_ids.includes(u.id) && u.user_id === user.username);
    if (units.length !== unit_ids.length) return res.status(400).json({ error: 'Invalid units' });
    const power = units.reduce((s, u) => s + unitCombatPower(u.stats as Record<string, unknown>), 0);
    store.gameZoneDeployments = store.gameZoneDeployments.filter((d) => !(d.zone_id === zoneId && d.user_id === user.username));
    store.gameZoneDeployments.push({ id: uuid(), zone_id: zoneId, user_id: user.username, unit_ids, deployed_power: power });
    return res.json({ deployed: true, power });
  }
  try {
    const result = await gameDb.deployToZone(supabase, user.username, zoneId, unit_ids);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/zones/:id/attack', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const zoneId = String(req.params.id);
  const { unit_ids } = req.body as { unit_ids: string[] };

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const zone = store.gameZones.find((z) => z.id === zoneId);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    const atkUnits = store.gameUnits.filter((u) => unit_ids.includes(u.id) && u.user_id === user.username);
    const atkPower = atkUnits.reduce((s, u) => s + unitCombatPower(u.stats as Record<string, unknown>), 0);
    const defDeployments = store.gameZoneDeployments.filter((d) => d.zone_id === zoneId && d.user_id !== user.username);
    const defPower = defDeployments.reduce((s, d) => s + d.deployed_power, 0);
    const variance = 0.95 + Math.random() * 0.1;
    const won = atkPower * variance > defPower;

    if (won) {
      zone.owner_user_id = user.username;
      for (const d of defDeployments) {
        store.gameUnits = store.gameUnits.filter((u) => !d.unit_ids.includes(u.id));
        store.gameZoneDeployments = store.gameZoneDeployments.filter((x) => x.id !== d.id);
      }
      const cmd = getOrCreateCommander(store, user.username);
      applyZoneYield(cmd, zone.yield_json);
      store.gameZoneDeployments.push({ id: uuid(), zone_id: zoneId, user_id: user.username, unit_ids, deployed_power: atkPower });
      awardXpDemo(store, user.username, 'zone_capture');
      return res.json({ won: true, atkPower: Math.floor(atkPower), defPower: Math.floor(defPower), zone });
    }

    store.gameUnits = store.gameUnits.filter((u) => !unit_ids.includes(u.id));
    return res.json({ won: false, atkPower: Math.floor(atkPower), defPower: Math.floor(defPower), troops_lost: unit_ids.length });
  }
  try {
    const result = await gameDb.attackZone(supabase, user.username, zoneId, unit_ids);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.get('/duels', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const duels = store.gameDuels.filter((d) => (d.challenger_id === user.username || d.defender_id === user.username) && d.status === 'pending');
    return res.json(duels);
  }
  try {
    const result = await gameDb.getDuels(supabase, user.username);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/duels/challenge', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { opponent } = req.body;
  if (!opponent || opponent === user.username) return res.status(400).json({ error: 'Invalid opponent' });

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const duel = { id: uuid(), challenger_id: user.username, defender_id: opponent, status: 'pending' };
    store.gameDuels.push(duel);
    return res.json(duel);
  }
  try {
    const result = await gameDb.createDuel(supabase, user.username, opponent);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/duels/:id/accept', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const duelId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const duel = store.gameDuels.find((d) => d.id === duelId && d.defender_id === user.username && d.status === 'pending');
    if (!duel) return res.status(404).json({ error: 'Duel not found' });

    const challenger = getOrCreateCommander(store, duel.challenger_id);
    const defender = getOrCreateCommander(store, duel.defender_id);
    duel.challenger_stake_json = rollDuelStakes(challenger);
    duel.defender_stake_json = rollDuelStakes(defender);

    deductCommanderResources(challenger, duel.challenger_stake_json!);
    deductCommanderResources(defender, duel.defender_stake_json!);

    const chUnits = store.gameUnits.filter((u) => u.user_id === duel.challenger_id);
    const defUnits = store.gameUnits.filter((u) => u.user_id === duel.defender_id);
    const chPower = chUnits.reduce((s, u) => s + unitCombatPower(u.stats as Record<string, unknown>), 0);
    const defPower = defUnits.reduce((s, u) => s + unitCombatPower(u.stats as Record<string, unknown>), 0);
    const variance = 0.95 + Math.random() * 0.1;
    const challengerWins = chPower * variance > defPower;

    const pot: Record<string, number> = { gold: 0, materials: 0, food: 0, faction_currency: 0 };
    for (const k of Object.keys(pot)) {
      pot[k] = (duel.challenger_stake_json![k] || 0) + (duel.defender_stake_json![k] || 0);
    }
    const winner = challengerWins ? challenger : defender;
    duel.winner_id = challengerWins ? duel.challenger_id : duel.defender_id;
    duel.status = 'completed';
    addCommanderResources(winner, {
      gold: Math.floor(pot.gold * 0.8),
      materials: Math.floor(pot.materials * 0.8),
      food: Math.floor(pot.food * 0.8),
      faction_currency: Math.floor(pot.faction_currency * 0.8),
    });
    awardXpDemo(store, duel.winner_id, 'duel_win');
    awardXpDemo(store, challengerWins ? duel.defender_id : duel.challenger_id, 'duel_lose');

    return res.json({
      duel,
      challengerWins,
      chPower: Math.floor(chPower),
      defPower: Math.floor(defPower),
      winner_id: duel.winner_id,
      stakes_hidden: false,
      challenger_stake: duel.challenger_stake_json,
      defender_stake: duel.defender_stake_json,
    });
  }
  try {
    const result = await gameDb.acceptDuel(supabase, user.username, duelId);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/sell', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { resource_type, amount } = req.body as { resource_type: string; amount: number };

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const stockpile = parseStockpile(cmd.stockpile_json);
    const hourSeed = Math.floor(Date.now() / 3600000);
    const cropPrices = getCropPrices(hourSeed);
    const orePrices = getOrePrices(hourSeed);
    let goldEarned = 0;

    if (cropPrices[resource_type] !== undefined) {
      const avail = stockpile.crops[resource_type] || 0;
      if (avail < amount) return res.status(400).json({ error: 'Not enough crops' });
      stockpile.crops[resource_type] = avail - amount;
      goldEarned = cropPrices[resource_type] * amount;
    } else if (orePrices[resource_type] !== undefined) {
      const avail = stockpile.ores[resource_type] || 0;
      if (avail < amount) return res.status(400).json({ error: 'Not enough ores' });
      stockpile.ores[resource_type] = avail - amount;
      goldEarned = orePrices[resource_type] * amount;
    } else {
      return res.status(400).json({ error: 'Unknown resource type' });
    }

    cmd.gold += goldEarned;
    cmd.stockpile_json = stockpile;
    return res.json({ commander: cmd, gold_earned: goldEarned });
  }

  try {
    const result = await gameDb.sellResource(supabase, user.username, resource_type, amount);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/buildings/:id/upgrade', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const buildingId = String(req.params.id);
  const { slot } = req.body as { slot: number };

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const building = store.gameBuildings.find((b) => b.id === buildingId && b.user_id === user.username);
    if (!building) return res.status(404).json({ error: 'Building not found' });

    const meta = (building.building_meta_json || defaultBuildingMeta(building.building_key)) as {
      upgrades: Record<string, number>; crop?: string;
    };
    const slotKey = String(slot);
    const currentLevel = meta.upgrades[slotKey] || 0;
    const cost = upgradeSlotCost(building.building_key, slot, currentLevel);
    const cmd = getOrCreateCommander(store, user.username);
    if (cmd.gold < cost.gold || cmd.materials < cost.materials) {
      return res.status(400).json({ error: 'Not enough resources' });
    }
    cmd.gold -= cost.gold;
    cmd.materials -= cost.materials;
    meta.upgrades[slotKey] = currentLevel + 1;
    building.building_meta_json = meta;
    if (building.building_key === 'smithy' && slot === 1) {
      const smithy = store.gameBuildings.find((b) => b.user_id === user.username && b.building_key === 'smithy');
      const smithyUpgrades = ((smithy?.building_meta_json as { upgrades?: Record<string, number> })?.upgrades) || meta.upgrades;
      cmd.pickaxe_tier = getPickaxeTier(smithyUpgrades, cmd.pickaxe_tier || 1);
    }
    return res.json({ building, commander: cmd });
  }

  try {
    const result = await gameDb.upgradeBuildingSlot(supabase, user.username, buildingId, slot);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/buildings/:id/crop', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const buildingId = String(req.params.id);
  const { crop } = req.body as { crop: string };

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const building = store.gameBuildings.find((b) => b.id === buildingId && b.user_id === user.username);
    if (!building) return res.status(404).json({ error: 'Building not found' });
    const meta = (building.building_meta_json || defaultBuildingMeta(building.building_key)) as {
      upgrades: Record<string, number>; crop?: string;
    };
    const unlocked = getUnlockedCrops(meta.upgrades || {});
    if (!unlocked.includes(crop)) return res.status(400).json({ error: 'Crop not unlocked' });
    meta.crop = crop;
    building.building_meta_json = meta;
    return res.json({ building });
  }

  try {
    const result = await gameDb.setBuildingCrop(supabase, user.username, buildingId, crop);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/mine/collect', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { building_id } = req.body as { building_id: string };

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const building = store.gameBuildings.find((b) => b.id === building_id && b.user_id === user.username);
    if (!building || building.building_key !== 'mine') return res.status(404).json({ error: 'Mine not found' });
    const cmd = getOrCreateCommander(store, user.username);
    const meta = (building.building_meta_json || defaultBuildingMeta('mine')) as { upgrades: Record<string, number> };
    const smithy = store.gameBuildings.find((b) => b.user_id === user.username && b.building_key === 'smithy');
    const smithyUpgrades = ((smithy?.building_meta_json as { upgrades?: Record<string, number> })?.upgrades) || {};
    const pickaxeTier = getPickaxeTier(smithyUpgrades, cmd.pickaxe_tier || 1);
    const ores = rollOres(pickaxeTier, building.level + (meta.upgrades?.['1'] || 0), Date.now());
    const stockpile = parseStockpile(cmd.stockpile_json);
    for (const [k, v] of Object.entries(ores)) stockpile.ores[k] = (stockpile.ores[k] || 0) + v;
    cmd.stockpile_json = stockpile;
    cmd.pickaxe_tier = pickaxeTier;
    return res.json({ ores, commander: cmd, pickaxe_tier: pickaxeTier });
  }

  try {
    const result = await gameDb.mineCollect(supabase, user.username, building_id);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.get('/dungeon', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const seed = getDungeonSeed();
    const rooms = generateDungeonRooms(seed, cmd.power_rating || 10);
    const run = store.gameDungeonRuns.find((r) => r.user_id === user.username && r.seed === seed);
    return res.json({
      seed,
      resets_at: dungeonResetsAt(),
      rooms_preview: rooms.map((r) => ({ index: r.index, name: r.name, icon: r.icon })),
      room_count: rooms.length,
      run: run || null,
    });
  }

  try {
    const result = await gameDb.getDungeon(supabase, user.username);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/dungeon/enter', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const seed = getDungeonSeed();
    const rooms = generateDungeonRooms(seed, cmd.power_rating || 10);
    const existing = store.gameDungeonRuns.find((r) => r.user_id === user.username && r.seed === seed);
    if (existing?.status === 'completed') return res.status(400).json({ error: 'Already completed this dungeon' });
    if (existing) return res.json({ run: existing, rooms });
    const run = {
      id: uuid(), user_id: user.username, seed, room_index: 0, status: 'active',
      rooms_json: rooms, loot_json: [], completed_at: null,
    };
    store.gameDungeonRuns.push(run);
    return res.json({ run, rooms });
  }

  try {
    const result = await gameDb.enterDungeon(supabase, user.username);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

router.post('/dungeon/claim', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const seed = getDungeonSeed();
    const run = store.gameDungeonRuns.find((r) => r.user_id === user.username && r.seed === seed && r.status === 'active');
    if (!run) return res.status(404).json({ error: 'No active dungeon run' });
    const rooms = run.rooms_json as Array<{ index: number; enemyPower: number; lootRarity: string }>;
    const room = rooms[run.room_index];
    if (!room) return res.status(400).json({ error: 'Invalid room' });
    const cmd = getOrCreateCommander(store, user.username);
    if (cmd.power_rating < room.enemyPower * 0.8) return res.status(400).json({ error: 'Not strong enough' });

    let pity = store.gamePity.find((p) => p.user_id === user.username);
    if (!pity) { pity = { user_id: user.username, rolls_since_rare: 0, rolls_since_legendary: 0 }; store.gamePity.push(pity); }
    const { item, newPity } = rollLoot(pity);
    pity.rolls_since_rare = newPity.rolls_since_rare;
    pity.rolls_since_legendary = newPity.rolls_since_legendary;

    const inv = {
      id: uuid(), user_id: user.username, item_id: item.id, name: item.name,
      rarity: item.rarity, stats: item.stats, quantity: 1, equipped_to_unit: null,
    };
    store.gameInventory.push(inv);
    run.loot_json = [...(run.loot_json || []), inv];
    run.room_index += 1;
    if (run.room_index >= rooms.length) {
      run.status = 'completed';
      run.completed_at = new Date().toISOString();
    }
    return res.json({ run, loot: inv, completed: run.status === 'completed' });
  }

  try {
    const result = await gameDb.claimDungeonRoom(supabase, user.username);
    res.json(result);
  } catch (err) { handleGameError(res, err); }
});

export default router;
