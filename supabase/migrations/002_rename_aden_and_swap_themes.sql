-- Rename dada to aden and swap themes
-- Aden: morty, Edward: enclave, Jamie: warlock

UPDATE profiles SET username = 'aden', display_name = 'Aden', theme = 'morty', avatar_emoji = '🧪' WHERE username = 'dada';
UPDATE profiles SET theme = 'enclave', avatar_emoji = '🦅' WHERE username = 'edward';

-- Update all user_id references
UPDATE daily_assignments SET user_id = 'aden' WHERE user_id = 'dada';
UPDATE task_stats SET user_id = 'aden' WHERE user_id = 'dada';
UPDATE house_fund_transactions SET user_id = 'aden' WHERE user_id = 'dada';
UPDATE bills SET created_by = 'aden' WHERE created_by = 'dada';
UPDATE bills SET paid_by = 'aden' WHERE paid_by = 'dada';
UPDATE subscriptions SET owner_id = 'aden' WHERE owner_id = 'dada';
UPDATE mood_checkins SET user_id = 'aden' WHERE user_id = 'dada';
UPDATE mini_game_state SET user_id = 'aden' WHERE user_id = 'dada';
UPDATE stash_bags SET added_by = 'aden' WHERE added_by = 'dada';
UPDATE stash_consumption SET user_id = 'aden' WHERE user_id = 'dada';
UPDATE weed_purchases SET purchased_by = 'aden' WHERE purchased_by = 'dada';
UPDATE litter_cleanings SET cleaned_by = 'aden' WHERE cleaned_by = 'dada';
UPDATE feeding_logs SET fed_by = 'aden' WHERE fed_by = 'dada';

-- Cats table
CREATE TABLE IF NOT EXISTS cats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  owner_ids TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cats (name, color, owner_ids) VALUES
  ('Gomez', 'black', ARRAY['aden']),
  ('Milo', 'grey', ARRAY['edward', 'jamie'])
ON CONFLICT (name) DO NOTHING;

-- Update litter box names
UPDATE litter_boxes SET name = 'Living Room Litter Box', location = 'Living Room' WHERE name = 'Main Box' OR location = 'Living Room';
UPDATE litter_boxes SET name = 'Bedroom Litter Box', location = 'Bedroom' WHERE name = 'Bedroom Box' OR location = 'Master Bedroom';
