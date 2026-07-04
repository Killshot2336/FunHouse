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
  cats: Array<{ id: string; name: string; color: string; owner_ids: string[] }>;
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
  gameCommanders: Array<{
    user_id: string; patron: string; gold: number; materials: number; food: number;
    faction_currency: number; village_level: number; power_rating: number;
    story_chapter: number; story_seen: boolean; grid_size: number; last_seen_at: string;
  }>;
  gameBuildings: Array<{ id: string; user_id: string; building_key: string; grid_x: number; grid_y: number; level: number }>;
  gameUnits: Array<{
    id: string; user_id: string; unit_key: string; slot_index: number; rarity?: string;
    stats: Record<string, unknown>;
    cosmetics: { armor: string; aura: string; weapon: string; banner: string };
    equipment: Record<string, string | null>;
  }>;
  gameInventory: Array<{
    id: string; user_id: string; item_id: string; name: string; rarity: string;
    stats: Record<string, number>; quantity: number; equipped_to_unit: string | null;
  }>;
  gameMissions: Array<{ user_id: string; mission_key: string; status: string; progress: number }>;
  gamePity: Array<{ user_id: string; rolls_since_rare: number; rolls_since_legendary: number }>;
  gameTrades: Array<{
    id: string; from_user: string; to_user: string;
    offer_json: Record<string, unknown>; request_json: Record<string, unknown>;
    status: string; created_at: string;
  }>;
  gamePatrols: Array<{ id: string; user_id: string; started_at: string; completes_at: string; result_json: Record<string, unknown> | null }>;
  profileProgress: Array<{ user_id: string; xp: number; level: number; sp_unspent: number; sp_spent_json: string[] }>;
  gameZones: Array<{ id: string; zone_x: number; zone_y: number; zone_type: string; owner_user_id: string | null; yield_json: Record<string, number>; last_claim_at: string }>;
  gameZoneDeployments: Array<{ id: string; zone_id: string; user_id: string; unit_ids: string[]; deployed_power: number }>;
  gameDuels: Array<{ id: string; challenger_id: string; defender_id: string; status: string; challenger_stake_json?: Record<string, number>; defender_stake_json?: Record<string, number>; winner_id?: string }>;
}

const MASTER_TASKS = [
  { name: 'Dishes', description: 'Wash and put away all dishes', icon: '🍽️' },
  { name: 'Trash', description: 'Take out all household trash', icon: '🗑️' },
  { name: 'Bong', description: 'Clean the bong', icon: '🫧' },
  { name: 'Vacuum', description: 'Vacuum common areas', icon: '🧹' },
  { name: 'Bathroom', description: 'Clean bathroom surfaces', icon: '🚿' },
  { name: 'Counters', description: 'Wipe down kitchen counters', icon: '🧽' },
  { name: 'Floors', description: 'Mop or sweep floors', icon: '🧹', active: false },
  { name: 'Laundry', description: 'Do a load of laundry', icon: '👕' },
  { name: 'Recycling', description: 'Sort and take out recycling', icon: '♻️', active: false },
  { name: 'Plants', description: 'Water household plants', icon: '🌱' },
  { name: 'Pet Area', description: 'Clean pet feeding area', icon: '🐾' },
  { name: 'Fridge', description: 'Clean out expired fridge items', icon: '🧊' },
];

function seedZones(): DemoStore['gameZones'] {
  const zones: DemoStore['gameZones'] = [];
  const types = ['farm', 'mine', 'market', 'ruins', 'fortress'];
  const yields: Record<string, Record<string, number>> = {
    farm: { food: 15 }, mine: { materials: 12 }, market: { gold: 20 }, ruins: { faction_currency: 8 }, fortress: { gold: 10, materials: 10 },
  };
  for (let x = 0; x < 12; x++) {
    for (let y = 0; y < 12; y++) {
      const t = types[(x + y) % 5];
      zones.push({
        id: uuid(), zone_x: x, zone_y: y, zone_type: t,
        owner_user_id: null, yield_json: yields[t], last_claim_at: new Date().toISOString(),
      });
    }
  }
  return zones;
}

function createInitialStore(): DemoStore {
  const weekStart = getWeekStart();
  const masterTasks = MASTER_TASKS.map((t) => ({ id: uuid(), active: true, ...t }));

  return {
    cats: [
      { id: uuid(), name: 'Gomez', color: 'black', owner_ids: ['aden'] },
      { id: uuid(), name: 'Milo', color: 'grey', owner_ids: ['edward', 'jamie'] },
    ],
    litterBoxes: [
      { id: uuid(), name: 'Living Room Litter Box', location: 'Living Room', created_at: new Date().toISOString() },
      { id: uuid(), name: 'Bedroom Litter Box', location: 'Bedroom', created_at: new Date().toISOString() },
    ],
    litterCleanings: [],
    feedingLogs: [],
    masterTasks,
    dailyAssignments: [],
    weeklyBoss: [{ id: uuid(), week_start: weekStart, max_health: 63, current_health: 63, champion_tasks: 0 }],
    taskStats: [
      { id: uuid(), user_id: 'aden', week_start: weekStart, tasks_completed: 0 },
      { id: uuid(), user_id: 'edward', week_start: weekStart, tasks_completed: 0 },
      { id: uuid(), user_id: 'jamie', week_start: weekStart, tasks_completed: 0 },
    ],
    houseFund: [],
    bills: [
      { id: uuid(), name: 'Rent', amount: 1200, due_date: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0], paid: false, created_by: 'edward', created_at: new Date().toISOString() },
      { id: uuid(), name: 'Electric', amount: 145, due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], paid: false, created_by: 'edward', created_at: new Date().toISOString() },
      { id: uuid(), name: 'Internet', amount: 79, due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], paid: true, paid_by: 'aden', created_by: 'edward', created_at: new Date().toISOString() },
    ],
    subscriptions: [
      { id: uuid(), name: 'Netflix', price: 15.99, next_billing_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], visibility: 'public', owner_id: 'aden', active: true, created_at: new Date().toISOString() },
      { id: uuid(), name: 'Spotify', price: 10.99, next_billing_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0], visibility: 'public', owner_id: 'jamie', active: true, created_at: new Date().toISOString() },
    ],
    moodCheckins: [],
    anonymousVents: [],
    miniGameState: [],
    stashBags: [],
    stashConsumption: [],
    weedFund: { money_saved: 0, updated_at: new Date().toISOString() },
    weedPurchases: [],
    gameCommanders: [],
    gameBuildings: [],
    gameUnits: [],
    gameInventory: [],
    gameMissions: [],
    gamePity: [],
    gameTrades: [],
    gamePatrols: [],
    profileProgress: [],
    gameZones: seedZones(),
    gameZoneDeployments: [],
    gameDuels: [],
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
