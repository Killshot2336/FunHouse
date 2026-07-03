// Simple UUID generator
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

import { getWeekStart } from '../lib/supabase.js';

interface DemoStore {
  litterBoxes: Array<{ id: string; name: string; location: string; created_at: string }>;
  litterCleanings: Array<{ id: string; litter_box_id: string; cleaned_by: string; cleaned_at: string }>;
  feedingLogs: Array<{ id: string; cat_names: string[]; fed_by: string; fed_at: string; notes?: string }>;
  masterTasks: Array<{ id: string; name: string; description: string; icon: string; active: boolean }>;
  dailyAssignments: Array<{ id: string; user_id: string; task_id: string; assigned_date: string; completed: boolean; completed_at?: string; completed_by?: string }>;
  weeklyBoss: Array<{ id: string; week_start: string; max_health: number; current_health: number; champion?: string; champion_tasks: number }>;
  taskStats: Array<{ id: string; user_id: string; week_start: string; tasks_completed: number }>;
  houseFund: Array<{ id: string; user_id: string; amount: number; type: string; reason?: string; created_at: string }>;
  bills: Array<{ id: string; name: string; amount: number; due_date: string; paid: boolean; paid_by?: string; paid_at?: string; created_by: string; created_at: string }>;
  subscriptions: Array<{ id: string; name: string; price: number; next_billing_date: string; visibility: string; owner_id: string; active: boolean; created_at: string }>;
  moodCheckins: Array<{ id: string; user_id: string; mood: string; checkin_date: string; created_at: string }>;
  anonymousVents: Array<{ id: string; vent_text: string; created_at: string; displayed: boolean }>;
  miniGameState: Array<{ id: string; user_id: string; game_type: string; state: Record<string, unknown>; updated_at: string }>;
  stashBags: Array<{ id: string; name: string; weight_grams: number; initial_weight: number; added_by: string; created_at: string; depleted: boolean }>;
  stashConsumption: Array<{ id: string; bag_id: string; user_id: string; amount_grams: number; type: string; consumed_at: string }>;
  weedFund: { money_saved: number; updated_at: string };
  weedPurchases: Array<{ id: string; amount: number; purchased_by: string; purchased_at: string; notes?: string }>;
}

const MASTER_TASKS = [
  { name: 'Dishes', description: 'Wash and put away all dishes', icon: '🍽️' },
  { name: 'Trash', description: 'Take out all household trash', icon: '🗑️' },
  { name: 'Bong', description: 'Clean the bong', icon: '🫧' },
  { name: 'Vacuum', description: 'Vacuum common areas', icon: '🧹' },
  { name: 'Bathroom', description: 'Clean bathroom surfaces', icon: '🚿' },
  { name: 'Counters', description: 'Wipe down kitchen counters', icon: '🧽' },
  { name: 'Floors', description: 'Mop or sweep floors', icon: '🧹' },
  { name: 'Laundry', description: 'Do a load of laundry', icon: '👕' },
  { name: 'Recycling', description: 'Sort and take out recycling', icon: '♻️' },
  { name: 'Plants', description: 'Water household plants', icon: '🌱' },
  { name: 'Pet Area', description: 'Clean pet feeding area', icon: '🐾' },
  { name: 'Fridge', description: 'Clean out expired fridge items', icon: '🧊' },
];

function createInitialStore(): DemoStore {
  const weekStart = getWeekStart();
  const masterTasks = MASTER_TASKS.map((t) => ({ id: uuid(), ...t, active: true }));

  return {
    litterBoxes: [
      { id: uuid(), name: 'Main Box', location: 'Living Room', created_at: new Date().toISOString() },
      { id: uuid(), name: 'Bedroom Box', location: 'Master Bedroom', created_at: new Date().toISOString() },
    ],
    litterCleanings: [],
    feedingLogs: [],
    masterTasks,
    dailyAssignments: [],
    weeklyBoss: [{ id: uuid(), week_start: weekStart, max_health: 63, current_health: 63, champion_tasks: 0 }],
    taskStats: [
      { id: uuid(), user_id: 'edward', week_start: weekStart, tasks_completed: 0 },
      { id: uuid(), user_id: 'dada', week_start: weekStart, tasks_completed: 0 },
      { id: uuid(), user_id: 'jamie', week_start: weekStart, tasks_completed: 0 },
    ],
    houseFund: [],
    bills: [
      { id: uuid(), name: 'Rent', amount: 1200, due_date: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0], paid: false, created_by: 'dada', created_at: new Date().toISOString() },
      { id: uuid(), name: 'Electric', amount: 145, due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], paid: false, created_by: 'dada', created_at: new Date().toISOString() },
      { id: uuid(), name: 'Internet', amount: 79, due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], paid: true, paid_by: 'edward', created_by: 'dada', created_at: new Date().toISOString() },
    ],
    subscriptions: [
      { id: uuid(), name: 'Netflix', price: 15.99, next_billing_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], visibility: 'public', owner_id: 'edward', active: true, created_at: new Date().toISOString() },
      { id: uuid(), name: 'Spotify', price: 10.99, next_billing_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], visibility: 'public', owner_id: 'jamie', active: true, created_at: new Date().toISOString() },
    ],
    moodCheckins: [],
    anonymousVents: [],
    miniGameState: [],
    stashBags: [],
    stashConsumption: [],
    weedFund: { money_saved: 0, updated_at: new Date().toISOString() },
    weedPurchases: [],
  };
}

let store: DemoStore = createInitialStore();

export function getDemoStore(): DemoStore {
  return store;
}

export function resetDemoStore(): void {
  store = createInitialStore();
}

export { uuid };
