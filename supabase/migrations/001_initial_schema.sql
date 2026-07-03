-- Funhouse Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL CHECK (username IN ('edward', 'dada', 'jamie')),
  display_name TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('morty', 'enclave', 'warlock')),
  avatar_emoji TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default users
INSERT INTO profiles (username, display_name, theme, avatar_emoji) VALUES
  ('edward', 'Edward', 'morty', '🧪'),
  ('dada', 'Dada', 'enclave', '🦅'),
  ('jamie', 'Jamie', 'warlock', '🔮');

-- Litter boxes
CREATE TABLE litter_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE litter_cleanings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  litter_box_id UUID REFERENCES litter_boxes(id) ON DELETE CASCADE,
  cleaned_by TEXT NOT NULL,
  cleaned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cat feeding
CREATE TABLE feeding_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cat_names TEXT[] NOT NULL,
  fed_by TEXT NOT NULL,
  fed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Master task list
CREATE TABLE master_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📋',
  active BOOLEAN DEFAULT TRUE
);

-- Daily task assignments
CREATE TABLE daily_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  task_id UUID REFERENCES master_tasks(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  UNIQUE(user_id, task_id, assigned_date)
);

-- Weekly boss
CREATE TABLE weekly_boss (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL UNIQUE,
  max_health INTEGER DEFAULT 63,
  current_health INTEGER DEFAULT 63,
  champion TEXT,
  champion_tasks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completion stats
CREATE TABLE task_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  UNIQUE(user_id, week_start)
);

-- House fund
CREATE TABLE house_fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contribution', 'withdrawal')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_by TEXT,
  paid_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  next_billing_date DATE NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'private')),
  owner_id TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood check-ins
CREATE TABLE mood_checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('good', 'meh', 'not_great')),
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Anonymous vents
CREATE TABLE anonymous_vents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vent_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  displayed BOOLEAN DEFAULT FALSE
);

-- Mini-game state
CREATE TABLE mini_game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  game_type TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stash (private for Edward & Dada)
CREATE TABLE stash_bags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  weight_grams DECIMAL(10,2) NOT NULL,
  initial_weight DECIMAL(10,2) NOT NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  depleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE stash_consumption (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bag_id UUID REFERENCES stash_bags(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount_grams DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bowl', 'pinch')),
  consumed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weed_fund (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  money_saved DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weed_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount DECIMAL(10,2) NOT NULL,
  purchased_by TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Seed master tasks
INSERT INTO master_tasks (name, description, icon) VALUES
  ('Dishes', 'Wash and put away all dishes', '🍽️'),
  ('Trash', 'Take out all household trash', '🗑️'),
  ('Bong', 'Clean the bong', '🫧'),
  ('Vacuum', 'Vacuum common areas', '🧹'),
  ('Bathroom', 'Clean bathroom surfaces', '🚿'),
  ('Counters', 'Wipe down kitchen counters', '🧽'),
  ('Floors', 'Mop or sweep floors', '🧹'),
  ('Laundry', 'Do a load of laundry', '👕'),
  ('Recycling', 'Sort and take out recycling', '♻️'),
  ('Plants', 'Water household plants', '🌱'),
  ('Pet Area', 'Clean pet feeding area', '🐾'),
  ('Fridge', 'Clean out expired fridge items', '🧊');

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE litter_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE litter_cleanings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_boss ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_vents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mini_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE stash_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE stash_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE weed_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE weed_purchases ENABLE ROW LEVEL SECURITY;

-- Permissive policies for household app (authenticated users)
CREATE POLICY "Allow all for authenticated" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all litter_boxes" ON litter_boxes FOR ALL USING (true);
CREATE POLICY "Allow all litter_cleanings" ON litter_cleanings FOR ALL USING (true);
CREATE POLICY "Allow all feeding_logs" ON feeding_logs FOR ALL USING (true);
CREATE POLICY "Allow all master_tasks" ON master_tasks FOR ALL USING (true);
CREATE POLICY "Allow all daily_assignments" ON daily_assignments FOR ALL USING (true);
CREATE POLICY "Allow all weekly_boss" ON weekly_boss FOR ALL USING (true);
CREATE POLICY "Allow all task_stats" ON task_stats FOR ALL USING (true);
CREATE POLICY "Allow all house_fund" ON house_fund_transactions FOR ALL USING (true);
CREATE POLICY "Allow all bills" ON bills FOR ALL USING (true);
CREATE POLICY "Allow all subscriptions" ON subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all mood_checkins" ON mood_checkins FOR ALL USING (true);
CREATE POLICY "Allow all anonymous_vents" ON anonymous_vents FOR ALL USING (true);
CREATE POLICY "Allow all mini_game_state" ON mini_game_state FOR ALL USING (true);
CREATE POLICY "Allow all stash_bags" ON stash_bags FOR ALL USING (true);
CREATE POLICY "Allow all stash_consumption" ON stash_consumption FOR ALL USING (true);
CREATE POLICY "Allow all weed_fund" ON weed_fund FOR ALL USING (true);
CREATE POLICY "Allow all weed_purchases" ON weed_purchases FOR ALL USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE litter_cleanings;
ALTER PUBLICATION supabase_realtime ADD TABLE feeding_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_boss;
ALTER PUBLICATION supabase_realtime ADD TABLE task_stats;
ALTER PUBLICATION supabase_realtime ADD TABLE house_fund_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE bills;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE mood_checkins;
ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_vents;
ALTER PUBLICATION supabase_realtime ADD TABLE stash_bags;
ALTER PUBLICATION supabase_realtime ADD TABLE stash_consumption;
