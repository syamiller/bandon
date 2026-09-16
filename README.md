# Bandon

Trip hub for the **Nov 15–18, 2026** Bandon week: tee schedule, individual trip points (match wins + skins every round), and mixed per-round formats.

## Quick start

```bash
npm install
npm run dev
```

## Handicaps

| Player | Index | Strokes off Simon |
|--------|-------|-------------------|
| Simon | 8 | 0 (group low) |
| Zach | 11 | +3 |
| Emory | 11 | +3 |
| Sammy | 11 | +3 |

## Live scoring (shared)

Scores live on a small API (`server/index.js`) so every device sees the same card.

```bash
npm run dev          # API :3001 + Vite :5173 (proxied /api)
npm run build && npm start   # production: API serves dist + /api
```

Match points and skins calculate automatically from each round’s format (best ball, Nassau, sixes, Wolf, CTP). Trip standings update as scores come in.


Hole pars, men’s stroke indexes, and Green/Back yardages live in [`src/data/scorecards.ts`](src/data/scorecards.ts) (GolfPass / resort sources noted per course).

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

Hero image is official Bandon Dunes photography (hole 12) from [bandondunesgolf.com](https://bandondunesgolf.com).
