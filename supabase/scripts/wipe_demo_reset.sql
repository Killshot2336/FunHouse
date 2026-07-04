-- Wipe Commander Village + demo progress for all housemates
-- Run in Supabase SQL Editor: https://supabase.com/dashboard → SQL → New query
-- Safe to re-run. Does NOT delete profiles, cats, bills, or master tasks.

-- Game data per user
DELETE FROM game_inventory WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_army_units WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_village_buildings WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_missions WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_patrols WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_drop_pity WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_dungeon_runs WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_zone_deployments WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM profile_progress WHERE user_id IN ('aden', 'edward', 'jamie');
DELETE FROM game_commanders WHERE user_id IN ('aden', 'edward', 'jamie');

-- Shared game state
DELETE FROM game_trades WHERE from_user IN ('aden', 'edward', 'jamie') OR to_user IN ('aden', 'edward', 'jamie');
DELETE FROM game_duels WHERE challenger_id IN ('aden', 'edward', 'jamie') OR defender_id IN ('aden', 'edward', 'jamie');
UPDATE game_zones SET owner_user_id = NULL, last_claim_at = NOW();

-- Optional: uncomment to also reset chores, cat logs, fund (full household demo reset)
-- UPDATE daily_assignments SET completed = false, completed_at = NULL, completed_by = NULL WHERE user_id IN ('aden', 'edward', 'jamie');
-- UPDATE task_stats SET tasks_completed = 0 WHERE user_id IN ('aden', 'edward', 'jamie');
-- DELETE FROM litter_cleanings WHERE cleaned_by IN ('aden', 'edward', 'jamie');
-- DELETE FROM feeding_logs WHERE fed_by IN ('aden', 'edward', 'jamie');
-- DELETE FROM house_fund_transactions WHERE user_id IN ('aden', 'edward', 'jamie');
