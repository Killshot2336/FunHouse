import { Router, Request, Response } from 'express';
import { isDemoMode, supabase } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/moods', async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const moods = store.moodCheckins.filter((m) => m.checkin_date === today);
    const vents = store.anonymousVents.filter((v) => !v.displayed);
    return res.json({ moods, vents });
  }

  const { data: moods } = await supabase.from('mood_checkins').select('*').eq('checkin_date', today);
  const { data: vents } = await supabase.from('anonymous_vents').select('*').eq('displayed', false);
  res.json({ moods, vents });
});

router.post('/mood', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { mood, vent_text } = req.body;
  const today = new Date().toISOString().split('T')[0];

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    store.moodCheckins = store.moodCheckins.filter((m) => !(m.user_id === user.username && m.checkin_date === today));
    const checkin = { id: uuid(), user_id: user.username, mood, checkin_date: today, created_at: new Date().toISOString() };
    store.moodCheckins.push(checkin);

    if (mood === 'not_great' && vent_text) {
      const vent = { id: uuid(), vent_text, created_at: new Date().toISOString(), displayed: false };
      store.anonymousVents.push(vent);
    }
    return res.json(checkin);
  }

  await supabase.from('mood_checkins').upsert({ user_id: user.username, mood, checkin_date: today }, { onConflict: 'user_id,checkin_date' });
  if (mood === 'not_great' && vent_text) {
    await supabase.from('anonymous_vents').insert({ vent_text });
  }
  res.json({ success: true });
});

router.post('/vents/:id/acknowledge', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const vent = store.anonymousVents.find((v) => v.id === id);
    if (vent) vent.displayed = true;
    return res.json({ success: true });
  }

  await supabase.from('anonymous_vents').update({ displayed: true }).eq('id', id);
  res.json({ success: true });
});

// Mini-games
router.get('/game', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const state = store.miniGameState.find((g) => g.user_id === user.username);
    return res.json(state?.state || getDefaultGameState(user.username));
  }

  const { data } = await supabase.from('mini_game_state').select('*').eq('user_id', user.username).single();
  res.json(data?.state || getDefaultGameState(user.username));
});

router.put('/game', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { state } = req.body;
  const gameType = user.username === 'edward' ? 'clicker' : user.username === 'dada' ? 'builder' : 'mirror';

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const idx = store.miniGameState.findIndex((g) => g.user_id === user.username);
    const entry = { id: uuid(), user_id: user.username, game_type: gameType, state, updated_at: new Date().toISOString() };
    if (idx >= 0) store.miniGameState[idx] = entry;
    else store.miniGameState.push(entry);
    return res.json(entry);
  }

  const { data, error } = await supabase.from('mini_game_state').upsert({ user_id: user.username, game_type: gameType, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

function getDefaultGameState(username: string): Record<string, unknown> {
  if (username === 'edward') {
    return { scrap: 0, totalTaps: 0, upgrades: { autoTinker: 0, multiplier: 1 }, inventory: [] };
  }
  if (username === 'dada') {
    return { level: 1, missions: [{ id: '1', name: 'Build Power Generator', completed: false, reward: 100 }], outpost: ['command_center'], resources: 0 };
  }
  return { essences: 0, cosmetics: { aura: 'none', armor: 'none', horns: 'none', eyes: 'default' }, ritualsCompleted: 0 };
}

// Stash (hidden from Jamie)
router.get('/stash', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username === 'jamie') return res.status(403).json({ error: 'Access denied' });

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const bags = store.stashBags.filter((b) => !b.depleted).map((b) => ({
      ...b,
      consumptions: store.stashConsumption.filter((c) => c.bag_id === b.id),
    }));
    return res.json({ bags, fund: store.weedFund, purchases: store.weedPurchases });
  }

  const { data: bags } = await supabase.from('stash_bags').select('*').eq('depleted', false);
  const { data: fund } = await supabase.from('weed_fund').select('*').limit(1).single();
  const { data: purchases } = await supabase.from('weed_purchases').select('*').order('purchased_at', { ascending: false });
  res.json({ bags, fund: fund || { money_saved: 0 }, purchases });
});

router.post('/stash/bags', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username === 'jamie') return res.status(403).json({ error: 'Access denied' });
  const { name, weight_grams } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const bag = { id: uuid(), name, weight_grams: Number(weight_grams), initial_weight: Number(weight_grams), added_by: user.username, created_at: new Date().toISOString(), depleted: false };
    store.stashBags.push(bag);
    return res.json(bag);
  }

  const { data, error } = await supabase.from('stash_bags').insert({ name, weight_grams, initial_weight: weight_grams, added_by: user.username }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/stash/bags/:id/consume', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username === 'jamie') return res.status(403).json({ error: 'Access denied' });
  const { id } = req.params;
  const bagId = String(id);
  const { type } = req.body;
  const amount = type === 'bowl' ? 0.5 : 0.1;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const bag = store.stashBags.find((b) => b.id === bagId);
    if (!bag || bag.weight_grams < amount) return res.status(400).json({ error: 'Insufficient weight' });
    bag.weight_grams -= amount;
    if (bag.weight_grams <= 0) bag.depleted = true;
    const consumption = { id: uuid(), bag_id: bagId, user_id: user.username, amount_grams: amount, type, consumed_at: new Date().toISOString() };
    store.stashConsumption.push(consumption);
    return res.json({ bag, consumption });
  }

  const { data: bag } = await supabase.from('stash_bags').select('*').eq('id', bagId).single();
  if (!bag || bag.weight_grams < amount) return res.status(400).json({ error: 'Insufficient weight' });
  const newWeight = bag.weight_grams - amount;
  await supabase.from('stash_bags').update({ weight_grams: newWeight, depleted: newWeight <= 0 }).eq('id', bagId);
  const { data: consumption } = await supabase.from('stash_consumption').insert({ bag_id: bagId, user_id: user.username, amount_grams: amount, type }).select().single();
  res.json({ bag: { ...bag, weight_grams: newWeight }, consumption });
});

router.get('/stash/stats', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username === 'jamie') return res.status(403).json({ error: 'Access denied' });

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const purchases = store.weedPurchases;
    const consumptions = store.stashConsumption;
    const monthAgo = Date.now() - 30 * 86400000;
    const hasMonthData = purchases.some((p) => new Date(p.purchased_at).getTime() < monthAgo) || consumptions.some((c) => new Date(c.consumed_at).getTime() < monthAgo);

    if (!hasMonthData) return res.json({ unlocked: false });

    const totalPurchased = purchases.reduce((s, p) => s + p.amount, 0);
    const totalConsumed = consumptions.reduce((s, c) => s + c.amount_grams, 0);
    const avgInterval = purchases.length > 1
      ? (new Date(purchases[0].purchased_at).getTime() - new Date(purchases[purchases.length - 1].purchased_at).getTime()) / (purchases.length - 1) / 86400000
      : null;

    return res.json({
      unlocked: true,
      avgPurchaseInterval: avgInterval,
      avgCost: purchases.length ? totalPurchased / purchases.length : 0,
      consumptionRate: totalConsumed,
      efficiency: totalConsumed > 0 ? totalPurchased / totalConsumed : 0,
    });
  }

  const { data: purchases } = await supabase.from('weed_purchases').select('*').order('purchased_at', { ascending: false });
  const { data: consumptions } = await supabase.from('stash_consumption').select('*');
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const hasMonthData = purchases?.some((p) => p.purchased_at < monthAgo);

  if (!hasMonthData) return res.json({ unlocked: false });

  const totalPurchased = purchases?.reduce((s, p) => s + Number(p.amount), 0) || 0;
  const totalConsumed = consumptions?.reduce((s, c) => s + Number(c.amount_grams), 0) || 0;

  res.json({
    unlocked: true,
    avgCost: purchases?.length ? totalPurchased / purchases.length : 0,
    consumptionRate: totalConsumed,
    efficiency: totalConsumed > 0 ? totalPurchased / totalConsumed : 0,
  });
});

router.post('/stash/purchases', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username === 'jamie') return res.status(403).json({ error: 'Access denied' });
  const { amount, notes } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const purchase = { id: uuid(), amount: Number(amount), purchased_by: user.username, purchased_at: new Date().toISOString(), notes };
    store.weedPurchases.push(purchase);
    return res.json(purchase);
  }

  const { data, error } = await supabase.from('weed_purchases').insert({ amount, purchased_by: user.username, notes }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/stash/fund', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  if (user.username === 'jamie') return res.status(403).json({ error: 'Access denied' });
  const { money_saved } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    store.weedFund.money_saved = Number(money_saved);
    store.weedFund.updated_at = new Date().toISOString();
    return res.json(store.weedFund);
  }

  const { data, error } = await supabase.from('weed_fund').upsert({ money_saved, updated_at: new Date().toISOString() }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
