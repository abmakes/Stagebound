# Stagebound

Solo public-speaking practice game for A2–B1 English learners in Vietnam (MC path · Ha Long Bay).

## Play

```bash
npm install
npm run dev
```

Open **http://127.0.0.1:5173/**

## Features

- Curriculum chapters 1–7 + **5 Final Speeches** (full delivery)
- Branching **skill tree** + **energy** (3, refill every 8h; **Get energy** quiz for +1)
- **Stagebound Score** (accuracy + finals + efficiency)
- **Class leaderboard** — shared live board for the whole class (Upstash Redis on Vercel)

## Shared class leaderboard (Vercel + free Redis)

The board used to live only in each browser’s `localStorage`, so students could not see each other on Vercel. It now posts to a small API (`/api/leaderboard`) backed by **Upstash Redis** (free tier).

### One-time setup

1. Create a free database at [Upstash](https://upstash.com/) → Redis → **Create database** (region near your students).
2. Copy **REST URL** and **REST TOKEN**.
3. In the [Vercel project](https://vercel.com/) → **Settings → Environment Variables**, add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Redeploy the site (Deployments → … → Redeploy).

Default class code is `WORLD2` (students can type `World2`). Students join once with their name + that code. After every chapter they clear, their Stagebound Score updates on the shared board so the class can see who is ahead.

Without the Redis env vars, the app still works and keeps a **this-device-only** fallback board.

### Local API testing

```bash
npm i -g vercel
vercel env pull .env.local
vercel dev
```

`vercel dev` serves `/api/leaderboard` with your env vars; plain `npm run dev` uses the local fallback.
