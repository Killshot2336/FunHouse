-- Friday AI rival faction battles

CREATE TABLE IF NOT EXISTS rival_learning_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  household_win_rate NUMERIC DEFAULT 0.5,
  avg_tasks_per_user INTEGER DEFAULT 0,
  preferred_units_json JSONB DEFAULT '[]',
  last_outcomes_json JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rival_weekly_battles (
  week_start DATE PRIMARY KEY,
  rival_name TEXT NOT NULL,
  rival_commander TEXT NOT NULL,
  rival_theme_index INTEGER NOT NULL DEFAULT 0,
  rival_hp_max INTEGER NOT NULL,
  rival_hp_current INTEGER NOT NULL,
  household_hp_max INTEGER NOT NULL DEFAULT 100,
  household_hp_current INTEGER NOT NULL DEFAULT 100,
  power_rating INTEGER NOT NULL DEFAULT 0,
  power_multiplier NUMERIC DEFAULT 1.0,
  outcome TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rival_battle_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  message TEXT NOT NULL,
  actor TEXT NOT NULL,
  damage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO rival_learning_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE rival_learning_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE rival_weekly_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rival_battle_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all rival_learning_state" ON rival_learning_state FOR ALL USING (true);
CREATE POLICY "Allow all rival_weekly_battles" ON rival_weekly_battles FOR ALL USING (true);
CREATE POLICY "Allow all rival_battle_log" ON rival_battle_log FOR ALL USING (true);
