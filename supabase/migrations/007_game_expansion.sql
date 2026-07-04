-- Profile XP and commander skill points
CREATE TABLE IF NOT EXISTS profile_progress (
  user_id TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  sp_unspent INTEGER NOT NULL DEFAULT 0,
  sp_spent_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- World map zones (shared household battlefield)
CREATE TABLE IF NOT EXISTS game_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_x INTEGER NOT NULL,
  zone_y INTEGER NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'farm',
  owner_user_id TEXT,
  yield_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_claim_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(zone_x, zone_y)
);

CREATE TABLE IF NOT EXISTS game_zone_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES game_zones(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  unit_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  deployed_power INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(zone_id, user_id)
);

-- 1v1 resource duels
CREATE TABLE IF NOT EXISTS game_duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id TEXT NOT NULL,
  defender_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  challenger_stake_json JSONB,
  defender_stake_json JSONB,
  winner_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 12x12 world zones if empty
INSERT INTO game_zones (zone_x, zone_y, zone_type, yield_json)
SELECT x, y,
  CASE ((x + y) % 5)
    WHEN 0 THEN 'farm'
    WHEN 1 THEN 'mine'
    WHEN 2 THEN 'market'
    WHEN 3 THEN 'ruins'
    ELSE 'fortress'
  END,
  CASE ((x + y) % 5)
    WHEN 0 THEN '{"food":15}'::jsonb
    WHEN 1 THEN '{"materials":12}'::jsonb
    WHEN 2 THEN '{"gold":20}'::jsonb
    WHEN 3 THEN '{"faction_currency":8}'::jsonb
    ELSE '{"gold":10,"materials":10}'::jsonb
  END
FROM generate_series(0, 11) AS x, generate_series(0, 11) AS y
ON CONFLICT (zone_x, zone_y) DO NOTHING;
