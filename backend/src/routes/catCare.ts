import { Router, Request, Response } from 'express';
import { isDemoMode, supabase, getUrgencyLevel } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';
import { awardXpDemo, awardXpLive } from './progress.js';

const router = Router();
router.use(authMiddleware);

const FALLBACK_CATS = [
  { id: 'gomez', name: 'Gomez', color: 'black', owner_ids: ['aden'] },
  { id: 'milo', name: 'Milo', color: 'grey', owner_ids: ['edward', 'jamie'] },
];

const FALLBACK_BOXES = [
  { id: 'living', name: 'Living Room Litter Box', location: 'Living Room' },
  { id: 'bedroom', name: 'Bedroom Litter Box', location: 'Bedroom' },
];

async function ensureLitterBoxes(sb: NonNullable<typeof supabase>) {
  const { data: existing } = await sb.from('litter_boxes').select('id').limit(1);
  if (existing?.length) return;

  await sb.from('litter_boxes').insert([
    { name: 'Living Room Litter Box', location: 'Living Room' },
    { name: 'Bedroom Litter Box', location: 'Bedroom' },
  ]);
}

// Cats
router.get('/cats', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    return res.json(getDemoStore().cats);
  }

  const { data, error } = await supabase.from('cats').select('*');
  if (error?.message?.includes('Could not find the table')) {
    return res.json(FALLBACK_CATS);
  }
  if (error) return res.status(500).json({ error: error.message });
  res.json(data?.length ? data : FALLBACK_CATS);
});

// Litter boxes
router.get('/litter-boxes', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const boxes = store.litterBoxes.map((box) => {
      const lastCleaning = store.litterCleanings
        .filter((c) => c.litter_box_id === box.id)
        .sort((a, b) => new Date(b.cleaned_at).getTime() - new Date(a.cleaned_at).getTime())[0];
      return {
        ...box,
        last_cleaning: lastCleaning || null,
        urgency: lastCleaning ? getUrgencyLevel(lastCleaning.cleaned_at) : 'red',
      };
    });
    return res.json(boxes);
  }

  await ensureLitterBoxes(supabase);

  const { data: boxes, error } = await supabase.from('litter_boxes').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const { data: cleanings } = await supabase.from('litter_cleanings').select('*').order('cleaned_at', { ascending: false });
  const result = (boxes?.length ? boxes : FALLBACK_BOXES).map((box) => {
    const lastCleaning = cleanings?.find((c) => c.litter_box_id === box.id);
    return { ...box, last_cleaning: lastCleaning || null, urgency: lastCleaning ? getUrgencyLevel(lastCleaning.cleaned_at) : 'red' };
  });
  res.json(result);
});

router.post('/litter-boxes', async (req: Request, res: Response) => {
  const { name, location } = req.body;
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const box = { id: uuid(), name, location, created_at: new Date().toISOString() };
    store.litterBoxes.push(box);
    return res.json(box);
  }
  const { data, error } = await supabase.from('litter_boxes').insert({ name, location }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/litter-boxes/:id/clean', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { id } = req.params;
  const boxId = String(id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const cleaning = { id: uuid(), litter_box_id: boxId, cleaned_by: user.username, cleaned_at: new Date().toISOString() };
    store.litterCleanings.push(cleaning);
    awardXpDemo(store, user.username, 'cat_care');
    return res.json(cleaning);
  }

  const { data, error } = await supabase.from('litter_cleanings').insert({ litter_box_id: boxId, cleaned_by: user.username }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await awardXpLive(user.username, 'cat_care');
  res.json(data);
});

router.delete('/litter-boxes/cleanings/:id', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const cleaningId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const idx = store.litterCleanings.findIndex((c) => c.id === cleaningId && c.cleaned_by === user.username);
    if (idx < 0) return res.status(404).json({ error: 'Cleaning not found' });
    store.litterCleanings.splice(idx, 1);
    return res.json({ undone: true });
  }

  const { data: cleaning } = await supabase.from('litter_cleanings').select('*').eq('id', cleaningId).single();
  if (!cleaning || cleaning.cleaned_by !== user.username) {
    return res.status(403).json({ error: 'Can only undo your own cleaning' });
  }

  await supabase.from('litter_cleanings').delete().eq('id', cleaningId);
  res.json({ undone: true });
});

// Feeding
router.get('/feeding', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const logs = store.feedingLogs.map((log) => ({
      ...log,
      urgency: getUrgencyLevel(log.fed_at, { green: 8, yellow: 12, orange: 16 }),
    }));
    return res.json(logs.sort((a, b) => new Date(b.fed_at).getTime() - new Date(a.fed_at).getTime()));
  }

  const { data, error } = await supabase.from('feeding_logs').select('*').order('fed_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data?.map((log) => ({ ...log, urgency: getUrgencyLevel(log.fed_at, { green: 8, yellow: 12, orange: 16 }) })));
});

router.post('/feeding', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { cat_names, notes } = req.body;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const log = { id: uuid(), cat_names, fed_by: user.username, fed_at: new Date().toISOString(), notes };
    store.feedingLogs.push(log);
    awardXpDemo(store, user.username, 'cat_care');
    return res.json(log);
  }

  const { data, error } = await supabase.from('feeding_logs').insert({ cat_names, fed_by: user.username, notes }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  await awardXpLive(user.username, 'cat_care');
  res.json(data);
});

router.delete('/feeding/:id', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const logId = String(req.params.id);

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const idx = store.feedingLogs.findIndex((l) => l.id === logId && l.fed_by === user.username);
    if (idx < 0) return res.status(404).json({ error: 'Feeding log not found' });
    store.feedingLogs.splice(idx, 1);
    return res.json({ undone: true });
  }

  const { data: log } = await supabase.from('feeding_logs').select('*').eq('id', logId).single();
  if (!log || log.fed_by !== user.username) {
    return res.status(403).json({ error: 'Can only undo your own feeding log' });
  }

  await supabase.from('feeding_logs').delete().eq('id', logId);
  res.json({ undone: true });
});

export default router;
