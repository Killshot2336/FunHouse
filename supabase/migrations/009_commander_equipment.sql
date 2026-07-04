-- Commander equipment, build perks from blueprint redeem, inventory commander flag

ALTER TABLE game_commanders
  ADD COLUMN IF NOT EXISTS commander_equipment_json JSONB DEFAULT '{"weapon":null,"armor":null,"relic":null}',
  ADD COLUMN IF NOT EXISTS build_perks_json JSONB DEFAULT '{"discounts":{},"vouchers":[]}';

ALTER TABLE game_inventory
  ADD COLUMN IF NOT EXISTS equipped_to_commander BOOLEAN DEFAULT FALSE;
