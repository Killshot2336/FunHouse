# Deploy Funhouse (2 steps)

Funhouse runs free on Vercel + Supabase. After this one-time setup, you only share a link — Edward and Jamie tap their name once on their phone and they're in.

## Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New Project** → import `Killshot2336/FunHouse`
3. Vercel reads settings from `vercel.json` automatically — click **Deploy**

## Step 2: Add environment variables in Vercel

In Vercel → your project → **Settings** → **Environment Variables**, add:

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (secret) |
| `SUPABASE_ANON_KEY` | anon public key |
| `VITE_SUPABASE_URL` | same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | same as `SUPABASE_ANON_KEY` |
| `JWT_SECRET` | long random string (64+ chars) |

Do **not** set `VITE_API_URL` — it defaults to `/api` on the same domain.

Click **Redeploy** after adding variables.

### Supabase migrations

In Supabase → **SQL Editor**, run each file in order (skip any that error because tables already exist):

1. `supabase/migrations/001_initial_schema.sql` — skip if `profiles` already exists
2. `supabase/migrations/002_rename_aden_and_swap_themes.sql`
3. `supabase/migrations/003_commander_village.sql`
4. `supabase/migrations/004_rival_faction.sql`
5. `supabase/migrations/005_fix_cats_litter_seed.sql`
6. `supabase/migrations/006_chore_rules.sql`
7. `supabase/migrations/007_game_expansion.sql`
8. `supabase/migrations/008_economy_dungeon.sql`
9. `supabase/migrations/009_commander_equipment.sql`

### Reset game data (fresh start)

In Supabase SQL Editor, run `supabase/scripts/wipe_game_reset.sql` — or log in as **Aden** → Commander Village → **Info** → **Reset All Game Data**.

### Post-deploy smoke test (Commander Village)

After merging the four-phase overhaul:

1. Log in as each player (Aden, Edward, Jamie) — theme should match (portal / tactical / arcane).
2. **Village**: place farm + market; wait ~1 min; counters auto-rise without harvest clicks.
3. **Army**: recruit, upgrade a stat, equip/unequip gear.
4. **Market**: sell crops; **Patrol**: start and claim.
5. **Dungeon**: enter → **FIGHT** boss (max 20s animation) → loot lands in Loot tab.
6. **Trade**: send gift; other player accept or decline.
7. **Duels**: challenge; defender accept or either cancel.
8. **World**: capture zone; passive yield accrues hourly on owned zones.
9. Run factory reset once if old broken save data exists.

## Share the link

Vercel gives you a URL like `https://funhouse-xxxx.vercel.app`. Text it to Edward and Jamie.

### Install on iPhone (Jamie)

1. Open the link in **Safari** (not Chrome)
2. Tap **Share** → **Add to Home Screen** → **Add**
3. Open from home screen → tap **Jamie**

### Install on Android (Edward)

1. Open the link in Chrome
2. Menu → **Install app** or **Add to Home screen**
3. Tap **Edward**

### Verify it works

- Visit `https://your-app.vercel.app/api/health` — should show `{ "demoMode": false }`
- Complete a task on one phone → it appears on the others within seconds

## That's it

No passwords. No app store. Push to GitHub → Vercel auto-updates. Cost: $0.
