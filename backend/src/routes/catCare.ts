import { Router, Request, Response } from 'express';
import { isDemoMode, supabase, getUrgencyLevel } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Cats
router.get('/cats', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    return res.json(getDemoStore().cats);
  }
  const { data, error } = await supabase.from('cats').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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

  const { data: boxes, error } = await supabase.from('litter_boxes').select('*');
  if (error) return res.status(500).json({ error: error.message });

  const { data: cleanings } = await supabase.from('litter_cleanings').select('*').order('cleaned_at', { ascending: false });
  const result = boxes?.map((box) => {
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
    return res.json(cleaning);
  }

  const { data, error } = await supabase.from('litter_cleanings').insert({ litter_box_id: boxId, cleaned_by: user.username }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
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
    return res.json(log);
  }

  const { data, error } = await supabase.from('feeding_logs').insert({ cat_names, fed_by: user.username, notes }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
