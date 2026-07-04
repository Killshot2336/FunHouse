import { SupabaseClient } from '@supabase/supabase-js';
import { getWeekStart } from './supabase.js';

export const RIVAL_ROTATION = [
  {
    name: 'The Citadel Remnant',
    commander: 'Colonel Autumn',
    vibe: 'enclave',
    taunts: [
      'The Citadel has deployed Power Armor to your sector.',
      'Enclave forces advance — your household crumbles.',
      'Democracy is non-negotiable. Surrender your chores.',
      'Vertibirds inbound. Resistance is futile.',
    ],
    counterAttacks: [
      'Power Armor squad breaches the living room perimeter.',
      'Vertibird strafing run damages household morale.',
      'Enclave scientists deploy a chore-dampening field.',
    ],
  },
  {
    name: 'Dimension C-137 Raiders',
    commander: 'Evil Morty',
    vibe: 'rick',
    taunts: [
      'Your dimension is *burp* ours now, mortals.',
      'Portal guns online. Your tasks mean nothing.',
      'Cronenberg variants deployed to your kitchen.',
      'We watched you slack off. Pathetic.',
    ],
    counterAttacks: [
      'Portal Troopers raid the supply closet.',
      'Meeseeks multiply — each one undoes a completed task.',
      'Interdimensional storm disrupts household sync.',
    ],
  },
  {
    name: 'The Hollow Court',
    commander: 'Shadow Archon',
    vibe: 'warlock',
    taunts: [
      'The Hollow Court hungers for your household order.',
      'Blood Knights march at dusk. Your chores will bleed.',
      'Arcane mist clouds your judgment, mortals.',
      'The Patron demands tribute — in completed tasks.',
    ],
    counterAttacks: [
      'Hexblade curse weakens your weekly champion.',
      'Shadow Acolytes siphon power from Commander Village.',
      'Rune Weaver disrupts the mood ring.',
    ],
  },
];

export function isFridayBattleActive(date = new Date()): boolean {
  const day = date.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

export function getFridayWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day >= 5 ? day - 5 : day + 2;
  d.setUTCDate(d.getUTCDate() - diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

interface LearningState {
  household_win_rate: number;
  avg_tasks_per_user: number;
  preferred_units_json: string[];
  last_outcomes_json: string[];
}

async function getLearningState(sb: SupabaseClient): Promise<LearningState> {
  const { data } = await sb.from('rival_learning_state').select('*').eq('id', 1).single();
  return {
    household_win_rate: Number(data?.household_win_rate ?? 0.5),
    avg_tasks_per_user: data?.avg_tasks_per_user ?? 0,
    preferred_units_json: (data?.preferred_units_json as string[]) || [],
    last_outcomes_json: (data?.last_outcomes_json as string[]) || [],
  };
}

async function getHouseholdPower(sb: SupabaseClient): Promise<{ totalPower: number; avgTasks: number; topUnits: string[] }> {
  const weekStart = getWeekStart();
  const { data: commanders } = await sb.from('game_commanders').select('user_id, power_rating, village_level');
  const totalPower = (commanders || []).reduce((sum, c) => sum + (c.power_rating || 0) + (c.village_level || 0) * 10, 0);

  const { data: stats } = await sb.from('task_stats').select('tasks_completed').eq('week_start', weekStart);
  const avgTasks = stats?.length
    ? Math.round(stats.reduce((s, t) => s + (t.tasks_completed || 0), 0) / stats.length)
    : 0;

  const { data: units } = await sb.from('game_army_units').select('unit_key');
  const unitCounts: Record<string, number> = {};
  for (const u of units || []) {
    unitCounts[u.unit_key] = (unitCounts[u.unit_key] || 0) + 1;
  }
  const topUnits = Object.entries(unitCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  return { totalPower: Math.max(totalPower, 30), avgTasks, topUnits };
}

function pickRivalTheme(weekStart: string): number {
  const weekNum = Math.floor(new Date(weekStart).getTime() / (7 * 86400000));
  return weekNum % RIVAL_ROTATION.length;
}

export async function ensureWeeklyBattle(sb: SupabaseClient) {
  const weekStart = getFridayWeekStart();
  const { data: existing } = await sb.from('rival_weekly_battles').select('*').eq('week_start', weekStart).single();

  if (existing) return existing;

  const learning = await getLearningState(sb);
  const household = await getHouseholdPower(sb);
  const themeIndex = pickRivalTheme(weekStart);
  const rival = RIVAL_ROTATION[themeIndex];

  let multiplier = 0.9 + Math.random() * 0.2;
  const recentWins = (learning.last_outcomes_json || []).filter((o) => o === 'household_win').length;
  if (recentWins >= 2) multiplier += 0.05;
  if (learning.household_win_rate < 0.4) multiplier -= 0.05;
  multiplier = Math.max(0.85, Math.min(1.15, multiplier));

  const rivalHp = Math.round(household.totalPower * multiplier);
  const householdHp = Math.round(household.totalPower * 0.8);

  const battle = {
    week_start: weekStart,
    rival_name: rival.name,
    rival_commander: rival.commander,
    rival_theme_index: themeIndex,
    rival_hp_max: rivalHp,
    rival_hp_current: rivalHp,
    household_hp_max: householdHp,
    household_hp_current: householdHp,
    power_rating: household.totalPower,
    power_multiplier: multiplier,
    outcome: 'active',
  };

  await sb.from('rival_weekly_battles').insert(battle);

  await sb.from('rival_battle_log').insert({
    week_start: weekStart,
    message: `${rival.commander} of ${rival.name} has declared war on your household!`,
    actor: 'system',
    damage: 0,
  });

  await sb.from('rival_battle_log').insert({
    week_start: weekStart,
    message: rival.taunts[Math.floor(Math.random() * rival.taunts.length)],
    actor: 'rival',
    damage: 0,
  });

  return battle;
}

export async function processRivalCounterAttack(sb: SupabaseClient) {
  if (!isFridayBattleActive()) return;

  const weekStart = getFridayWeekStart();
  const { data: battle } = await sb.from('rival_weekly_battles').select('*').eq('week_start', weekStart).single();
  if (!battle || battle.outcome !== 'active') return;

  const lastCounter = battle.last_counter_at ? new Date(battle.last_counter_at).getTime() : 0;
  const minInterval = 30 * 60 * 1000;
  if (Date.now() - lastCounter < minInterval) return;

  const rival = RIVAL_ROTATION[battle.rival_theme_index || 0];
  const damage = 2 + Math.floor(Math.random() * 3);
  const newHp = Math.max(0, (battle.household_hp_current || 0) - damage);

  await sb.from('rival_weekly_battles').update({
    household_hp_current: newHp,
    last_counter_at: new Date().toISOString(),
  }).eq('week_start', weekStart);

  const message = rival.counterAttacks[Math.floor(Math.random() * rival.counterAttacks.length)];
  await sb.from('rival_battle_log').insert({
    week_start: weekStart,
    message,
    actor: 'rival',
    damage,
  });

  if (newHp <= 0) {
    await sb.from('rival_weekly_battles').update({ outcome: 'rival_win' }).eq('week_start', weekStart);
    await updateLearning(sb, 'rival_win');
  }
}

export async function dealHouseholdDamage(sb: SupabaseClient, damage: number, message: string, actor = 'household') {
  if (!isFridayBattleActive()) return;

  const weekStart = getFridayWeekStart();
  const { data: battle } = await sb.from('rival_weekly_battles').select('*').eq('week_start', weekStart).single();
  if (!battle || battle.outcome !== 'active') return;

  const newHp = Math.max(0, battle.rival_hp_current - damage);
  await sb.from('rival_weekly_battles').update({ rival_hp_current: newHp }).eq('week_start', weekStart);

  await sb.from('rival_battle_log').insert({
    week_start: weekStart,
    message,
    actor,
    damage,
  });

  if (newHp <= 0) {
    await sb.from('rival_weekly_battles').update({ outcome: 'household_win' }).eq('week_start', weekStart);
    await updateLearning(sb, 'household_win');
    await sb.from('rival_battle_log').insert({
      week_start: weekStart,
      message: `Victory! ${battle.rival_name} retreats until next Friday.`,
      actor: 'system',
      damage: 0,
    });
  }
}

async function updateLearning(sb: SupabaseClient, outcome: string) {
  const learning = await getLearningState(sb);
  const outcomes = [...(learning.last_outcomes_json || []), outcome].slice(-4);
  const wins = outcomes.filter((o) => o === 'household_win').length;
  const winRate = outcomes.length ? wins / outcomes.length : 0.5;

  const household = await getHouseholdPower(sb);

  await sb.from('rival_learning_state').upsert({
    id: 1,
    household_win_rate: winRate,
    avg_tasks_per_user: household.avgTasks,
    preferred_units_json: household.topUnits,
    last_outcomes_json: outcomes,
    updated_at: new Date().toISOString(),
  });
}

export async function getRivalBattleState(sb: SupabaseClient) {
  const active = isFridayBattleActive();
  if (!active) {
    return { active: false, nextFriday: getDaysUntilFriday() };
  }

  const battle = await ensureWeeklyBattle(sb);
  const weekStart = getFridayWeekStart();

  const { data: logs } = await sb
    .from('rival_battle_log')
    .select('*')
    .eq('week_start', weekStart)
    .order('created_at', { ascending: false })
    .limit(20);

  const rival = RIVAL_ROTATION[battle.rival_theme_index || 0];

  return {
    active: true,
    battle,
    rival: {
      name: rival.name,
      commander: rival.commander,
      vibe: rival.vibe,
    },
    logs: (logs || []).reverse(),
  };
}

function getDaysUntilFriday(): number {
  const day = new Date().getUTCDay();
  if (day === 5) return 0;
  if (day === 6) return 6;
  if (day === 0) return 5;
  return 5 - day;
}

export async function resetWeeklyBattle(sb: SupabaseClient) {
  const weekStart = getFridayWeekStart();
  const household = await getHouseholdPower(sb);
  const themeIndex = pickRivalTheme(weekStart);
  const rival = RIVAL_ROTATION[themeIndex];
  const rivalHp = Math.round(household.totalPower * 1.0);
  const householdHp = Math.round(household.totalPower * 0.8);

  await sb.from('rival_battle_log').delete().eq('week_start', weekStart);

  await sb.from('rival_weekly_battles').upsert({
    week_start: weekStart,
    rival_name: rival.name,
    rival_commander: rival.commander,
    rival_theme_index: themeIndex,
    rival_hp_max: rivalHp,
    rival_hp_current: rivalHp,
    household_hp_max: householdHp,
    household_hp_current: householdHp,
    power_rating: household.totalPower,
    power_multiplier: 1.0,
    outcome: 'active',
    last_counter_at: null,
  });

  await sb.from('rival_battle_log').insert({
    week_start: weekStart,
    message: `Battle reset — ${rival.commander} re-engages your household!`,
    actor: 'system',
    damage: 0,
  });

  return getRivalBattleState(sb);
}
