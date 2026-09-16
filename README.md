# Bandon

Trip hub for the **Nov 15–18, 2026** Bandon week: tee schedule, shared live scoring, and automatic match / skins points.

## Quick start (local)

```bash
npm install
npm run dev          # API :3001 + Vite :5173 (proxies /api)
```

Local scores save to `data/scores.json` (gitignored). No Redis needed on your laptop.

## Deploy on Vercel

Vercel’s filesystem is ephemeral, so live scores need **Upstash Redis**.

### 1. Push the repo and import in Vercel
- [vercel.com/new](https://vercel.com/new) → import `syamiller/bandon`
- Framework preset: **Other** (or leave blank) — `vercel.json` sets `dist` as output
- Root directory: repo root
- Build command: `npm run build` (already in `vercel.json`)

### 2. Add Upstash Redis
In the Vercel project:
1. **Storage** → create / connect **Upstash Redis**  
   (or create a DB at [console.upstash.com](https://console.upstash.com) and paste env vars)
2. Ensure these env vars exist (Production + Preview):

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

See `.env.example`.

### 3. Deploy
Redeploy after env vars are set. The site is static Vite output; `/api/scores` runs as serverless functions and reads/writes Redis.

### 4. Smoke test
- Open the site → **Score** → status should show **Shared · live**
- Enter a score on phone A, refresh phone B — same number
- `GET /api/scores` should return `{ "scores": {...}, "storage": "upstash", ... }`

## Handicaps

| Player | Index | Strokes off Simon |
|--------|-------|-------------------|
| Simon | 8 | 0 (group low) |
| Zach | 11 | +3 |
| Emory | 11 | +3 |
| Sammy | 11 | +3 |

## Scoring

- **Match points** — from each round’s format (best ball, Nassau, sixes, Wolf, CTP)
- **Skins** — unique best **net** only (ties carry); each skin = ¼ match point in standings
- Points are computed in the browser from shared gross scores (not stored separately)

## Scorecards

Hole pars, stroke indexes, and yardages: [`src/data/scorecards.ts`](src/data/scorecards.ts).

## Round formats

| Round | Course | Format |
|-------|--------|--------|
| Nov 15 am | Bandon Trails | Best ball match |
| Nov 15 pm | Bandon Preserve *(short)* | Closest to the pin |
| Nov 16 am | Shorty's *(short)* | Closest to the pin |
| Nov 16 pm | Bandon Dunes | Sixes · 1v1 |
| Nov 17 am | Pacific Dunes | Best ball Nassau |
| Nov 17 pm | Old McDonald | Wolf |
| Nov 18 am | Sheep Ranch | Finale best ball match |
