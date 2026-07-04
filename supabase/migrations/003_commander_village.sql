-- Commander Village game tables

CREATE TABLE IF NOT EXISTS game_commanders (
  user_id TEXT PRIMARY KEY,
  patron TEXT NOT NULL,
  gold INTEGER DEFAULT 100,
  materials INTEGER DEFAULT 50,
  food INTEGER DEFAULT 50,
  faction_currency INTEGER DEFAULT 0,
  village_level INTEGER DEFAULT 1,
  power_rating INTEGER DEFAULT 0,
  story_chapter INTEGER DEFAULT 0,
  story_seen BOOLEAN DEFAULT FALSE,
  grid_size INTEGER DEFAULT 8,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_village_buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  building_key TEXT NOT NULL,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  built_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grid_x, grid_y)
);

CREATE TABLE IF NOT EXISTS game_army_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  unit_key TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  stats_json JSONB DEFAULT '{}',
  cosmetics_json JSONB DEFAULT '{}',
  equipment_json JSONB DEFAULT '{}',
  UNIQUE(user_id, slot_index)
);

CREATE TABLE IF NOT EXISTS game_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,
  stats_json JSONB DEFAULT '{}',
  quantity INTEGER DEFAULT 1,
  equipped_to_unit UUID
);

CREATE TABLE IF NOT EXISTS game_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  mission_key TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, mission_key)
);

CREATE TABLE IF NOT EXISTS game_drop_pity (
  user_id TEXT PRIMARY KEY,
  rolls_since_rare INTEGER DEFAULT 0,
  rolls_since_legendary INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS game_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  offer_json JSONB NOT NULL,
  request_json JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_patrols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completes_at TIMESTAMPTZ NOT NULL,
  result_json JSONB
);

ALTER TABLE game_commanders ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_village_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_army_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_drop_pity ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_patrols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all game_commanders" ON game_commanders FOR ALL USING (true);
CREATE POLICY "Allow all game_village_buildings" ON game_village_buildings FOR ALL USING (true);
CREATE POLICY "Allow all game_army_units" ON game_army_units FOR ALL USING (true);
CREATE POLICY "Allow all game_inventory" ON game_inventory FOR ALL USING (true);
CREATE POLICY "Allow all game_missions" ON game_missions FOR ALL USING (true);
CREATE POLICY "Allow all game_drop_pity" ON game_drop_pity FOR ALL USING (true);
CREATE POLICY "Allow all game_trades" ON game_trades FOR ALL USING (true);
CREATE POLICY "Allow all game_patrols" ON game_patrols FOR ALL USING (true);
