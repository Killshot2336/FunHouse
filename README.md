# Funhouse

Private household PWA for **Aden**, **Edward**, and **Jamie**. One link, install on your phone like a native app, everything stays in sync.

## Use it on your phone (production)

1. Follow **[DEPLOY.md](DEPLOY.md)** — two steps: connect Vercel + paste Supabase keys
2. Open the Vercel link on your phone
3. Tap your name once — that device is locked to you forever
4. **iPhone:** Safari → Share → Add to Home Screen
5. **Android:** Chrome → Install app

No passwords. No `npm run dev` needed for daily use.

| Person | Theme | Cats |
|--------|-------|------|
| Aden | Rick & Morty | Gomez (black) |
| Edward | Fallout Enclave | Milo (grey, shared) |
| Jamie | Karlak Warlock | Milo (grey, shared) |

## What you get

- **Tap identity** — pick Aden / Edward / Jamie once per device
- **Real-time sync** — tasks, cats, boss HP, finances, Commander Village
- **Friday Faction War** — AI rival household battles every weekend
- **3 immersive themes** — full UI paradigms, not just colors
- **PWA** — fullscreen on home screen, works offline for cached pages

## Features

- Cat care (Gomez & Milo, bedroom + living room litter boxes)
- Daily chores (3 per person) + weekly boss (63 HP)
- House fund, bills (Edward), subscriptions, mood ring
- Commander Village — shared army-builder game with trading
- The Stash (Aden + Edward only)
- Friday AI rival faction battles that scale to your skill

## Stack

- React + Vite + Tailwind (frontend)
- Express API on Vercel serverless (backend)
- Supabase PostgreSQL (database)
- Free tier: Vercel Hobby + Supabase

## Local dev (optional)

Only needed if you're changing code:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Runs in demo mode without Supabase env vars

## Project structure

```
funhouse/
├── frontend/          # React PWA
├── backend/           # Express API
├── api/               # Vercel serverless entry
├── supabase/          # Database migrations
└── vercel.json        # Deploy config
```

## Deploy

See **[DEPLOY.md](DEPLOY.md)** for the full checklist.
