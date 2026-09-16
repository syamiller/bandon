# Bandon

Trip hub for the **Nov 15–18, 2026** Bandon Dunes golf week: tee schedule, The Bandon Cup (week-long best-ball match), and per-round games with rotating partners and formats.

## Quick start

```bash
npm install
npm run dev
```

## Edit the trip

All schedule, players, Cup sides, pairings, and formats live in [`src/data/trip.ts`](src/data/trip.ts).

Default players are **Simon, Matt, Ryan, Dan** — change the names there and the UI updates everywhere.

## How the games work

- **Always best ball** — every competition uses two-man best ball.
- **The Bandon Cup** — fixed sides (Simon/Matt vs Ryan/Dan) across all seven rounds; 1 point per round.
- **Round games** — partners and formats rotate each tee time (match play, Nassau, medal, sixes, Stableford, presses, finale Nassau).
