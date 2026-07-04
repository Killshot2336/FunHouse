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
  buildingCost,
  statUpgradeCost,
  calcPowerRating,
  type Patron,
} from '../lib/gameConfig.js';
import {
  calcOfflineResources,
  rollLoot,
  defaultUnitStats,
} from '../lib/gameEngine.js';

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
  cmd.gold += offline.gold;
  cmd.materials += offline.materials;
  cmd.food += offline.food;
  cmd.faction_currency += offline.faction;
  cmd.last_seen_at = new Date().toISOString();
}

// GET full game state
router.get('/state', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    applyOffline(store, user.username);
    const cmd = getOrCreateCommander(store, user.username);
    refreshPower(store, user.username);
    return res.json({
      commander: cmd,
      buildings: store.gameBuildings.filter((b) => b.user_id === user.username),
      units: store.gameUnits.filter((u) => u.user_id === user.username),
      inventory: store.gameInventory.filter((i) => i.user_id === user.username),
      missions: store.gameMissions.filter((m) => m.user_id === user.username),
      pity: store.gamePity.find((p) => p.user_id === user.username) || { rolls_since_rare: 0, rolls_since_legendary: 0 },
      patrols: store.gamePatrols.filter((p) => p.user_id === user.username && !p.result_json),
      story: STORY_INTROS[cmd.patron as Patron],
      config: { buildings: BUILDINGS, units: UNITS_BY_PATRON[cmd.patron as Patron], missions: MISSIONS },
    });
  }

  res.json({ error: 'Supabase game mode not yet wired' });
});

// Mark story seen
router.post('/story-seen', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    cmd.story_seen = true;
    return res.json({ success: true });
  }
  res.json({ success: true });
});

// Place building
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

    cmd.gold -= cost;
    const building = { id: uuid(), user_id: user.username, building_key, grid_x, grid_y, level: 1 };
    store.gameBuildings.push(building);
    const buildCount = store.gameBuildings.filter((b) => b.user_id === user.username).length;
    updateMissionProgress(store, user.username, 'build', buildCount);
    refreshPower(store, user.username);
    return res.json({ building, commander: cmd });
  }
  res.status(501).json({ error: 'Not implemented' });
});

// Recruit unit
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
  res.status(501).json({ error: 'Not implemented' });
});

// Upgrade unit stat
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

    const level = unit.stats[stat as keyof typeof unit.stats];
    const cost = statUpgradeCost(level);
    if (cmd.gold < cost || cmd.materials < Math.floor(cost / 2)) {
      return res.status(400).json({ error: 'Not enough resources' });
    }
    cmd.gold -= cost;
    cmd.materials -= Math.floor(cost / 2);
    unit.stats[stat as keyof typeof unit.stats] += 1;
    updateMissionProgress(store, user.username, 'upgrade', 1);
    refreshPower(store, user.username);
    return res.json({ unit, commander: cmd });
  }
  res.status(501).json({ error: 'Not implemented' });
});

// Customize unit
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
  res.status(501).json({ error: 'Not implemented' });
});

// Start patrol
router.post('/patrol', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cmd = getOrCreateCommander(store, user.username);
    const active = store.gamePatrols.find((p) => p.user_id === user.username && !p.result_json);
    if (active) return res.status(400).json({ error: 'Patrol already active' });

    const completes = new Date(Date.now() + 30000).toISOString();
    const patrol = { id: uuid(), user_id: user.username, started_at: new Date().toISOString(), completes_at: completes, result_json: null };
    store.gamePatrols.push(patrol);
    return res.json({ patrol });
  }
  res.status(501).json({ error: 'Not implemented' });
});

// Complete patrol (claim loot)
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
  res.status(501).json({ error: 'Not implemented' });
});

// Equip item
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
    for (const [k, v] of Object.entries(item.stats)) {
      if (k in unit.stats) unit.stats[k as keyof typeof unit.stats] += v;
    }
    refreshPower(store, user.username);
    return res.json({ item, unit });
  }
  res.status(501).json({ error: 'Not implemented' });
});

// Sell item
router.post('/inventory/:id/sell', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const itemId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const idx = store.gameInventory.findIndex((i) => i.id === itemId && i.user_id === user.username);
    if (idx < 0) return res.status(404).json({ error: 'Not found' });
    const item = store.gameInventory[idx];
    if (item.equipped_to_unit) return res.status(400).json({ error: 'Unequip first' });

    const sellValues: Record<string, number> = {
      common: 5, uncommon: 25, rare: 75, epic: 200, legendary: 500, mythic: 2000,
    };
    const cmd = getOrCreateCommander(store, user.username);
    cmd.gold += sellValues[item.rarity] || 5;
    store.gameInventory.splice(idx, 1);
    return res.json({ commander: cmd });
  }
  res.status(501).json({ error: 'Not implemented' });
});

// Collect offline resources manually
router.post('/collect', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    applyOffline(store, user.username);
    const cmd = getOrCreateCommander(store, user.username);
    return res.json({ commander: cmd });
  }
  res.status(501).json({ error: 'Not implemented' });
});

// Trades
router.get('/trades', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const trades = store.gameTrades.filter(
      (t) => (t.to_user === user.username || t.from_user === user.username) && t.status === 'pending'
    );
    return res.json(trades);
  }
  res.json([]);
});

router.post('/trades', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { to_user, offer, request } = req.body;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const trade = {
      id: uuid(), from_user: user.username, to_user,
      offer_json: offer, request_json: request,
      status: 'pending', created_at: new Date().toISOString(),
    };
    store.gameTrades.push(trade);
    return res.json(trade);
  }
  res.status(501).json({ error: 'Not implemented' });
});

router.post('/trades/:id/accept', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const tradeId = String(req.params.id);
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const trade = store.gameTrades.find((t) => t.id === tradeId && t.to_user === user.username && t.status === 'pending');
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const offer = trade.offer_json as { gold?: number; item_ids?: string[] };
    const request = trade.request_json as { gold?: number; item_ids?: string[] };
    const fromCmd = getOrCreateCommander(store, trade.from_user);
    const toCmd = getOrCreateCommander(store, trade.to_user);

    if (offer.gold) { fromCmd.gold -= offer.gold; toCmd.gold += offer.gold; }
    if (request.gold) { toCmd.gold -= request.gold; fromCmd.gold += request.gold; }

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
  res.status(501).json({ error: 'Not implemented' });
});

// Leaderboard
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
  res.json([]);
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

export default router;
