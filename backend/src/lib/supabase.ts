import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project');

export const supabase: SupabaseClient | null = isDemoMode
  ? null
  : createClient(supabaseUrl, supabaseKey);

export const USERS = {
  aden: { username: 'aden', displayName: 'Aden', theme: 'morty' as const },
  edward: { username: 'edward', displayName: 'Edward', theme: 'enclave' as const },
  jamie: { username: 'jamie', displayName: 'Jamie', theme: 'warlock' as const },
};

export type UserTheme = 'morty' | 'enclave' | 'warlock';

export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export function getUrgencyLevel(timestamp: string | Date, thresholds = { green: 12, yellow: 24, orange: 36 }): 'green' | 'yellow' | 'orange' | 'red' {
  const hours = (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  if (hours < thresholds.green) return 'green';
  if (hours < thresholds.yellow) return 'yellow';
  if (hours < thresholds.orange) return 'orange';
  return 'red';
}

export function getDueDateUrgency(dueDate: string): 'green' | 'yellow' | 'orange' | 'red' {
  const days = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days > 7) return 'green';
  if (days > 3) return 'yellow';
  if (days > 0) return 'orange';
  return 'red';
}
