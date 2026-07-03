# Funhouse

Cross-platform household management PWA for Edward, Dada, and Jamie. Three immersive themes, real-time sync, task battles, cat care, finances, mood tracking, mini-games, and more.

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend**: Node.js + Express REST API
- **Database**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel (free tier) + Supabase (free tier)

## Quick Start (Demo Mode)

The app runs in **demo mode** without Supabase credentials — all data is stored in-memory on the backend.

```bash
# Install dependencies
npm install
cd frontend && npm install
cd ../backend && npm install

# Start both servers
cd ..
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Login Credentials

| User   | Password | Theme                          |
|--------|----------|--------------------------------|
| Edward | `portal` | Rick & Morty (Morty Experience)|
| Dada   | `enclave`| Fallout 76 (Enclave Operative) |
| Jamie  | `warlock`| Karlak (Warlock Patron)        |

## Production Setup (Supabase)

1. Create a free [Supabase](https://supabase.com) project
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql`
3. Copy `.env.example` to `.env` and fill in your keys
4. Set the same `VITE_*` vars for the frontend

## Deploy to Vercel (Free)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Deploy — Vercel serves the frontend and API routes automatically

## Features

- **3 Unique Themes** — Full UI/UX paradigms per user (not just color swaps)
- **Authentication** — Auto theme loading on login
- **Real-Time Sync** — Supabase subscriptions (demo mode polls every 5-10s)
- **Cat Care** — Litter box tracker + feeding log with urgency colors
- **Task Management** — 3 daily tasks per user, weekly boss battle (63 HP)
- **House Fund** — Shared ledger for contributions/withdrawals
- **Bill Command Center** — Dada's bill tracker with prediction system
- **Subscriptions** — Public household + private per-user views
- **Mood Ring** — Daily check-in with anonymous vent thought bubbles
- **Mini-Games** — Edward's Clicker, Dada's Outpost Builder, Jamie's Mirror
- **The Stash Box** — Private inventory for Edward & Dada (hidden from Jamie)
- **PWA** — Installable on desktop, Android, and iOS home screens

## Project Structure

```
funhouse/
├── frontend/          # React SPA
├── backend/           # Express API
├── api/               # Vercel serverless entry
├── supabase/          # Database migrations
├── legacy/            # Previous HouseGrid app
└── vercel.json        # Deployment config
```
