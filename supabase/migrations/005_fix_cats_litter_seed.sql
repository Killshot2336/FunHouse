-- Ensure cats, litter boxes, and rival counter-attack throttle exist

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

INSERT INTO litter_boxes (name, location)
SELECT 'Living Room Litter Box', 'Living Room'
WHERE NOT EXISTS (SELECT 1 FROM litter_boxes WHERE location = 'Living Room');

INSERT INTO litter_boxes (name, location)
SELECT 'Bedroom Litter Box', 'Bedroom'
WHERE NOT EXISTS (SELECT 1 FROM litter_boxes WHERE location = 'Bedroom');

ALTER TABLE rival_weekly_battles
  ADD COLUMN IF NOT EXISTS last_counter_at TIMESTAMPTZ;

ALTER TABLE cats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all cats" ON cats FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
