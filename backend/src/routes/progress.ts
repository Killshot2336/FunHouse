import { Router, Request, Response } from 'express';
import { isDemoMode, supabase } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';
import { addXp, xpToLevel, totalXpForLevel, type ProfileProgress } from '../lib/progressEngine.js';
import { COMMANDER_SKILLS } from '../lib/gameConfig.js';

const router = Router();
router.use(authMiddleware);

function getOrCreateProgress(store: ReturnType<typeof getDemoStore>, userId: string): ProfileProgress {
  let p = store.profileProgress.find((x) => x.user_id === userId);
  if (!p) {
    p = { user_id: userId, xp: 0, level: 1, sp_unspent: 0, sp_spent_json: [] };
    store.profileProgress.push(p);
  }
  return p;
}

export function awardXpDemo(store: ReturnType<typeof getDemoStore>, userId: string, action: string): ProfileProgress {
  const p = getOrCreateProgress(store, userId);
  const updated = addXp(p, action === 'chore' ? 15 : action === 'cat_care' ? 10 : action === 'zone_capture' ? 40 : action === 'duel_win' ? 30 : action === 'pack_open' ? 25 : action === 'patrol' ? 20 : 10);
  const idx = store.profileProgress.findIndex((x) => x.user_id === userId);
  store.profileProgress[idx] = updated;
  return updated;
}

router.get('/', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const progress = getOrCreateProgress(store, user.username);
    return res.json({
      ...progress,
      xp_needed: xpToLevel(progress.level),
      xp_progress: progress.xp - totalXpForLevel(progress.level),
      skills: COMMANDER_SKILLS,
    });
  }

  const { data } = await supabase.from('profile_progress').select('*').eq('user_id', user.username).single();
  const progress = data || { user_id: user.username, xp: 0, level: 1, sp_unspent: 0, sp_spent_json: [] };
  if (!data) await supabase.from('profile_progress').insert(progress);
  res.json({
    ...progress,
    sp_spent_json: progress.sp_spent_json || [],
    xp_needed: xpToLevel(progress.level),
    xp_progress: progress.xp - totalXpForLevel(progress.level),
    skills: COMMANDER_SKILLS,
  });
});

router.post('/spend', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { skill_key } = req.body;
  const skill = COMMANDER_SKILLS.find((s) => s.key === skill_key);
  if (!skill) return res.status(400).json({ error: 'Invalid skill' });

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const p = getOrCreateProgress(store, user.username);
    const spent = p.sp_spent_json || [];
    if (spent.includes(skill_key)) return res.status(400).json({ error: 'Already unlocked' });
    if (p.sp_unspent < skill.cost) return res.status(400).json({ error: 'Not enough SP' });
    p.sp_unspent -= skill.cost;
    p.sp_spent_json = [...spent, skill_key];
    return res.json({ progress: p, skill });
  }

  const { data: p } = await supabase.from('profile_progress').select('*').eq('user_id', user.username).single();
  if (!p) return res.status(400).json({ error: 'No progress' });
  const spent = (p.sp_spent_json as string[]) || [];
  if (spent.includes(skill_key)) return res.status(400).json({ error: 'Already unlocked' });
  if (p.sp_unspent < skill.cost) return res.status(400).json({ error: 'Not enough SP' });
  await supabase.from('profile_progress').update({
    sp_unspent: p.sp_unspent - skill.cost,
    sp_spent_json: [...spent, skill_key],
  }).eq('user_id', user.username);
  res.json({ skill });
});

export default router;
