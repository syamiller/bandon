import { scorecardsByRoundId, type Hole, type Scorecard } from './data/scorecards'
import {
  players,
  strokesOffLow,
  type PlayerId,
} from './data/trip'

export type HoleScore = number | null

/** roundId → playerId → hole index (0-based) → gross strokes */
export type RoundScores = Record<string, Record<PlayerId, HoleScore[]>>

const STORAGE_KEY = 'bandon-live-scores-v1'

export function emptyScoresForCard(card: Scorecard): Record<PlayerId, HoleScore[]> {
  const blank = () => Array.from({ length: card.holes }, () => null as HoleScore)
  return {
    simon: blank(),
    zach: blank(),
    emory: blank(),
    sammy: blank(),
  }
}

export function loadScores(): RoundScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as RoundScores
  } catch {
    return {}
  }
}

export function saveScores(scores: RoundScores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

/** True if this player gets a stroke on this hole (SI ≤ strokes received). */
export function getsStroke(playerId: PlayerId, hole: Hole): boolean {
  const strokes = strokesOffLow(playerId)
  return strokes > 0 && hole.strokeIndex <= strokes
}

export function netScore(
  playerId: PlayerId,
  hole: Hole,
  gross: number | null,
): number | null {
  if (gross == null || !Number.isFinite(gross)) return null
  return gross - (getsStroke(playerId, hole) ? 1 : 0)
}

export function sumDefined(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v != null)
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0)
}

export function toPar(
  total: number | null,
  holesPlayed: Hole[],
  scores: HoleScore[],
): number | null {
  if (total == null) return null
  let parPlayed = 0
  let any = false
  holesPlayed.forEach((h, i) => {
    if (scores[i] != null) {
      parPlayed += h.par
      any = true
    }
  })
  if (!any) return null
  return total - parPlayed
}

export function formatToPar(n: number | null): string {
  if (n == null) return '—'
  if (n === 0) return 'E'
  return n > 0 ? `+${n}` : String(n)
}

export function cardForRound(roundId: string): Scorecard | undefined {
  return scorecardsByRoundId[roundId]
}

export function playerIds(): PlayerId[] {
  return players.map((p) => p.id)
}
