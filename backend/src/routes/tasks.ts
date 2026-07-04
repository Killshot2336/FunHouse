import { Router, Request, Response } from 'express';
import { isDemoMode, supabase, getWeekStart } from '../lib/supabase.js';
import { getDemoStore, uuid } from '../lib/demoStore.js';
import { authMiddleware, AuthPayload } from '../middleware/auth.js';
import { dealHouseholdDamage } from '../lib/rivalAI.js';

const router = Router();
router.use(authMiddleware);

const USERS_LIST = ['aden', 'edward', 'jamie'];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function ensureDailyAssignments(store: ReturnType<typeof getDemoStore>, date: string) {
  const existing = store.dailyAssignments.filter((a) => a.assigned_date === date);
  if (existing.length >= 9) return existing;

  const tasks = shuffleArray(store.masterTasks.filter((t) => t.active));
  store.dailyAssignments = store.dailyAssignments.filter((a) => a.assigned_date !== date);

  for (const userId of USERS_LIST) {
    const userTasks = shuffleArray(tasks).slice(0, 3);
    for (const task of userTasks) {
      store.dailyAssignments.push({
        id: uuid(),
        user_id: userId,
        task_id: task.id,
        assigned_date: date,
        completed: false,
      });
    }
  }
  return store.dailyAssignments.filter((a) => a.assigned_date === date);
}

router.get('/master', async (_req: Request, res: Response) => {
  if (isDemoMode || !supabase) {
    return res.json(getDemoStore().masterTasks);
  }
  const { data, error } = await supabase.from('master_tasks').select('*').eq('active', true);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/daily', async (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    await ensureDailyAssignments(store, today);
    const assignments = store.dailyAssignments
      .filter((a) => a.assigned_date === today)
      .map((a) => ({
        ...a,
        task: store.masterTasks.find((t) => t.id === a.task_id),
      }));
    return res.json(assignments);
  }

  const { data: existing } = await supabase.from('daily_assignments').select('*, master_tasks(*)').eq('assigned_date', today);
  if (existing && existing.length >= 9) return res.json(existing);

  const { data: tasks } = await supabase.from('master_tasks').select('*').eq('active', true);
  if (!tasks?.length) return res.json([]);

  const shuffled = shuffleArray(tasks);
  const inserts = [];
  for (const userId of USERS_LIST) {
    const userTasks = shuffleArray(shuffled).slice(0, 3);
    for (const task of userTasks) {
      inserts.push({ user_id: userId, task_id: task.id, assigned_date: today });
    }
  }

  await supabase.from('daily_assignments').upsert(inserts, { onConflict: 'user_id,task_id,assigned_date' });
  const { data } = await supabase.from('daily_assignments').select('*, master_tasks(*)').eq('assigned_date', today);
  res.json(data);
});

router.post('/complete/:id', async (req: Request, res: Response) => {
  const user = (req as Request & { user: AuthPayload }).user;
  const { id } = req.params;
  const weekStart = getWeekStart();

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    const assignment = store.dailyAssignments.find((a) => a.id === id);
    if (!assignment || assignment.completed) return res.status(400).json({ error: 'Task not found or already completed' });

    assignment.completed = true;
    assignment.completed_at = new Date().toISOString();
    assignment.completed_by = user.username;

    let boss = store.weeklyBoss.find((b) => b.week_start === weekStart);
    if (!boss) {
      boss = { id: uuid(), week_start: weekStart, max_health: 63, current_health: 63, champion_tasks: 0 };
      store.weeklyBoss.push(boss);
    }
    boss.current_health = Math.max(0, boss.current_health - 1);

    let stat = store.taskStats.find((s) => s.user_id === user.username && s.week_start === weekStart);
    if (!stat) {
      stat = { id: uuid(), user_id: user.username, week_start: weekStart, tasks_completed: 0 };
      store.taskStats.push(stat);
    }
    stat.tasks_completed += 1;

    const topStat = store.taskStats.filter((s) => s.week_start === weekStart).sort((a, b) => b.tasks_completed - a.tasks_completed)[0];
    if (topStat && boss) {
      boss.champion = topStat.user_id;
      boss.champion_tasks = topStat.tasks_completed;
    }

    return res.json({ assignment, boss, stat });
  }

  const { data: assignment, error } = await supabase
    .from('daily_assignments')
    .update({ completed: true, completed_at: new Date().toISOString(), completed_by: user.username })
    .eq('id', id)
    .eq('completed', false)
    .select()
    .single();

  if (error || !assignment) return res.status(400).json({ error: 'Task not found or already completed' });

  const { data: boss } = await supabase.from('weekly_boss').select('*').eq('week_start', weekStart).single();
  if (boss) {
    await supabase.from('weekly_boss').update({ current_health: Math.max(0, boss.current_health - 1) }).eq('id', boss.id);
  } else {
    await supabase.from('weekly_boss').insert({ week_start: weekStart, max_health: 63, current_health: 62 });
  }

  const { data: stat } = await supabase.from('task_stats').select('*').eq('user_id', user.username).eq('week_start', weekStart).single();
  if (stat) {
    await supabase.from('task_stats').update({ tasks_completed: stat.tasks_completed + 1 }).eq('id', stat.id);
  } else {
    await supabase.from('task_stats').insert({ user_id: user.username, week_start: weekStart, tasks_completed: 1 });
  }

  const { data: stats } = await supabase.from('task_stats').select('*').eq('week_start', weekStart).order('tasks_completed', { ascending: false }).limit(1);
  if (stats?.[0]) {
    await supabase.from('weekly_boss').update({ champion: stats[0].user_id, champion_tasks: stats[0].tasks_completed }).eq('week_start', weekStart);
  }

  await dealHouseholdDamage(
    supabase,
    3,
    `${user.displayName} completed a chore — household forces strike the rival!`,
    user.username
  );

  res.json({ assignment });
});

router.get('/boss', async (_req: Request, res: Response) => {
  const weekStart = getWeekStart();

  if (isDemoMode || !supabase) {
    const store = getDemoStore();
    let boss = store.weeklyBoss.find((b) => b.week_start === weekStart);
    if (!boss) {
      boss = { id: uuid(), week_start: weekStart, max_health: 63, current_health: 63, champion_tasks: 0 };
      store.weeklyBoss.push(boss);
    }
    const stats = store.taskStats.filter((s) => s.week_start === weekStart);
    return res.json({ boss, stats });
  }

  let { data: boss } = await supabase.from('weekly_boss').select('*').eq('week_start', weekStart).single();
  if (!boss) {
    const { data } = await supabase.from('weekly_boss').insert({ week_start: weekStart }).select().single();
    boss = data;
  }
  const { data: stats } = await supabase.from('task_stats').select('*').eq('week_start', weekStart);
  res.json({ boss, stats });
});

export default router;
