-- Economy, mining, dungeon expansion
ALTER TABLE game_commanders ADD COLUMN IF NOT EXISTS stockpile_json JSONB NOT NULL DEFAULT '{"crops":{},"ores":{},"wood":0,"stone":0}'::jsonb;
ALTER TABLE game_commanders ADD COLUMN IF NOT EXISTS pickaxe_tier INTEGER NOT NULL DEFAULT 1;

ALTER TABLE game_village_buildings ADD COLUMN IF NOT EXISTS building_meta_json JSONB NOT NULL DEFAULT '{"upgrades":{"1":0,"2":0,"3":0,"4":0,"5":0},"crop":"corn"}'::jsonb;

CREATE TABLE IF NOT EXISTS game_dungeon_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  seed BIGINT NOT NULL,
  room_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  loot_json JSONB DEFAULT '[]'::jsonb,
  rooms_json JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, seed)
);
