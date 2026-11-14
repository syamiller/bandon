import { scorecardsByRoundId, type Hole, type Scorecard } from './data/scorecards'
import {
  players,
  type TeamAssignments,
  type PlayerId,
} from './data/trip'

export type HoleScore = number | null

/** roundId → playerId → hole index (0-based) → gross strokes */
export type RoundScores = Record<string, Record<PlayerId, HoleScore[]>>
export type ClosestToPinScores = Record<string, (PlayerId | null)[]>
export type RoundHandicaps = Partial<Record<PlayerId, number>>
export type RoundHandicapsById = Record<string, RoundHandicaps>
export type TeeSelections = Record<string, string>

export type ScoresStore = {
  scores: RoundScores
  closestToPin?: ClosestToPinScores
  teamAssignments?: TeamAssignments | null
  tees?: TeeSelections
  handicaps?: RoundHandicapsById
  updatedAt: string | null
  storage?: 'file' | 'upstash'
}

export function emptyScoresForCard(card: Scorecard): Record<PlayerId, HoleScore[]> {
  const blank = () => Array.from({ length: card.holes }, () => null as HoleScore)
  return {
    simon: blank(),
    zach: blank(),
    emory: blank(),
    sammy: blank(),
  }
}

export function emptyClosestToPinForCard(card: Scorecard): (PlayerId | null)[] {
  return Array.from({ length: card.holes }, () => null)
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export function fetchScores(): Promise<ScoresStore> {
  return api<ScoresStore>('/api/scores')
}

export function putScores(scores: RoundScores): Promise<ScoresStore> {
  return api<ScoresStore>('/api/scores', {
    method: 'PUT',
    body: JSON.stringify({ scores }),
  })
}

export function patchRoundScores(
  roundId: string,
  roundScores: Record<PlayerId, HoleScore[]>,
): Promise<ScoresStore> {
  return api<ScoresStore>(`/api/scores/${encodeURIComponent(roundId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ roundScores }),
  })
}

export function patchClosestToPin(roundId: string, closestToPin: (PlayerId | null)[]) {
  return api<ScoresStore>(`/api/scores/${encodeURIComponent(roundId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ closestToPin }),
  })
}

export function patchTeamAssignments(teamAssignments: TeamAssignments): Promise<ScoresStore> {
  return api<ScoresStore>('/api/scores', {
    method: 'PATCH',
    body: JSON.stringify({ teamAssignments }),
  })
}

export function patchRoundSettings(
  roundId: string,
  settings: { teeId?: string; handicaps?: RoundHandicaps },
): Promise<ScoresStore> {
  return api<ScoresStore>(`/api/scores/${encodeURIComponent(roundId)}`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  })
}

export function scorecardForRound(roundId: string, teeId?: string): Scorecard | undefined {
  const card = scorecardsByRoundId[roundId]
  if (!card) return undefined
  const tee = card.teeOptions.find((option) => option.id === teeId) ?? card.teeOptions.find((option) => option.name === card.tee)
  if (!tee) return card
  return {
    ...card,
    tee: tee.name,
    rating: tee.rating,
    slope: tee.slope,
    ratingPar: tee.ratingPar,
    ratingHoles: tee.ratingHoles ?? 18,
  }
}

export function courseHandicap(playerId: PlayerId, card: Scorecard, handicapOverride?: number): number {
  const player = players.find((entry) => entry.id === playerId)
  const { rating, slope, ratingPar, ratingHoles = 18 } = card
  const index = handicapOverride ?? player?.handicap ?? 0
  if (rating == null || slope == null || ratingPar == null) return index
  const fullCourse = (index * slope) / 113 + rating - ratingPar
  return Math.round((fullCourse * card.holes) / ratingHoles)
}

export function strokesReceived(playerId: PlayerId, hole: Hole, card: Scorecard, handicapOverride?: number): number {
  const handicap = courseHandicap(playerId, card, handicapOverride)
  if (handicap < 0) {
    const giveBack = Math.abs(handicap)
    return -Math.floor(giveBack / card.holes) -
      (giveBack % card.holes > 0 && hole.strokeIndex > card.holes - (giveBack % card.holes) ? 1 : 0)
  }
  return Math.floor(handicap / card.holes) +
    (hole.strokeIndex <= handicap % card.holes ? 1 : 0)
}

/** True if this player gets a GHIN-adjusted course-handicap stroke on this hole. */
export function getsStroke(playerId: PlayerId, hole: Hole, card: Scorecard, handicapOverride?: number): boolean {
  return strokesReceived(playerId, hole, card, handicapOverride) > 0
}

export function netScore(
  playerId: PlayerId,
  hole: Hole,
  gross: number | null,
  card: Scorecard,
  handicapOverride?: number,
): number | null {
  if (gross == null || !Number.isFinite(gross)) return null
  return gross - strokesReceived(playerId, hole, card, handicapOverride)
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

export function formatPoints(n: number): string {
  if (Number.isInteger(n)) return String(n)
  return n.toFixed(1)
}
