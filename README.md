# Bandon

Trip hub for the **Nov 15–18, 2026** Bandon week: tee schedule, shared live scoring, and automatic match and side-game points.

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
| Sammy | 11.5 | GHIN Handicap Index |
| Zach | 12.5 | GHIN Handicap Index |
| Emory | 11.7 | GHIN Handicap Index |
| Simon | 8.2 | GHIN Handicap Index |

Course handicaps are calculated per scorecard from the GHIN index, tee rating, slope, and hole stroke index. On the 13- and 19-hole courses, the 18-hole course handicap is scaled to the played holes.

## Round games

| Round | Format | Points |
|-------|--------|--------|
| Bandon Trails | Best-ball Nassau match play: front, back, overall | 8 (2 / 2 / 4) |
| Bandon Preserve | Two 13-hole 1v1 net matches; team partners share the win | 4 (2 per match) |
| Shorty’s | Combined net stroke play | 4 |
| Bandon Dunes | 18-hole best-ball match play | 8 |
| Old Macdonald | Two 9-hole sets of 1v1 net matches; team partners share wins | 8 (2 per match) |
| Sheep Ranch | St. James Roll: 6 dots per hole; trip finish pays 5 / 2 / 1 | 8 finish points |
| Pacific Dunes | Best-ball Nassau net stroke play: front, back, overall | 8 (2 / 2 / 4) |

Partners stay together across both rounds each day. The first three days rotate all three possible pairings; Preserve and Old Macdonald singles cover each of the six head-to-head pairings once. Use **Shuffle slots + teams** in the live scorecard to draw a new shared team plan.

## Trip side games

- Net Stableford over every round: 5 / 2 / 1 for the top three.
- Best completed net-to-par round: 2 points.
- Most gross birdies: 2 points.
- Each eagle: 5 points. Each hole-in-one: 10 points; a Shorty’s ace earns 5 extra.
- Mark closest-to-pin on every par 3 at Preserve and Shorty’s; most across both earns 1 point.

Scores, closest-to-pin selections, and the team draw are shared through the scoring API. Stableford, match points, and trip standings recalculate from the live scorecards.

## Scorecards

Hole pars, stroke indexes, and yardages: [`src/data/scorecards.ts`](src/data/scorecards.ts).

## Round formats

| Round | Course | Format |
|-------|--------|--------|
| Nov 15, 9:50 am | Bandon Trails | Nassau best-ball match play |
| Nov 15, 3:15 pm | Bandon Preserve *(short)* | Two 1v1 matches |
| Nov 16, 8:30 am | Shorty’s *(short)* | Combined net stroke play |
| Nov 16, 12:00 pm | Bandon Dunes | Best-ball match play |
| Nov 17, 7:30 am | Pacific Dunes | Nassau best-ball stroke play |
| Nov 17, 1:00 pm | Old Macdonald | Two 9-hole sets of 1v1 matches |
| Nov 18, 8:30 am | Sheep Ranch | St. James Roll · final round |
