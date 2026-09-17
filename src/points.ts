import { scorecardsByRoundId, type Hole } from './data/scorecards'
import {
  pairLabel,
  playerName,
  players,
  schedule,
  type PlayerId,
  type Round,
  type RoundGame,
} from './data/trip'
import {
  emptyScoresForCard,
  netScore,
  playerIds,
  type HoleScore,
  type RoundScores,
} from './scoring'

export type PointEvent = {
  roundId: string
  label: string
  detail: string
  /** Weighted points toward standings. */
  points: Partial<Record<PlayerId, number>>
  /** Raw skin count awarded (match events omit this). */
  skinsWon?: Partial<Record<PlayerId, number>>
}

export type RoundResult = {
  roundId: string
  course: string
  format: string
  events: PointEvent[]
  matchPoints: Record<PlayerId, number>
  /** Raw skins won (unique net winners; carry pot size). */
  skinsWon: Record<PlayerId, number>
  /** Skins toward standings (= skinsWon × SKIN_WEIGHT). */
  skinPoints: Record<PlayerId, number>
  total: Record<PlayerId, number>
}

export type TripStandings = {
  byPlayer: Record<
    PlayerId,
    {
      match: number
      skins: number
      skinPoints: number
      total: number
      name: string
    }
  >
  rounds: RoundResult[]
}

/** One skin is worth this fraction of a match point in trip standings. */
export const SKIN_WEIGHT = 0.25

function zero(): Record<PlayerId, number> {
  return { simon: 0, zach: 0, emory: 0, sammy: 0 }
}

function addPoints(
  target: Record<PlayerId, number>,
  pts: Partial<Record<PlayerId, number>>,
) {
  for (const id of playerIds()) {
    target[id] += pts[id] ?? 0
  }
}

function netForHole(
  scores: Record<PlayerId, HoleScore[]>,
  hole: Hole,
  holeIndex: number,
  playerId: PlayerId,
): number | null {
  return netScore(playerId, hole, scores[playerId]?.[holeIndex] ?? null)
}

function bestNet(
  scores: Record<PlayerId, HoleScore[]>,
  hole: Hole,
  holeIndex: number,
  pair: [PlayerId, PlayerId],
): number | null {
  const a = netForHole(scores, hole, holeIndex, pair[0])
  const b = netForHole(scores, hole, holeIndex, pair[1])
  if (a == null && b == null) return null
  if (a == null) return b
  if (b == null) return a
  return Math.min(a, b)
}

function awardSplit(
  winners: PlayerId[],
  amount: number,
): Partial<Record<PlayerId, number>> {
  if (winners.length === 0 || amount === 0) return {}
  const each = amount / winners.length
  const pts: Partial<Record<PlayerId, number>> = {}
  for (const id of winners) pts[id] = each
  return pts
}

/**
 * Skins — individual net only.
 * - All four must have a score on the hole before it settles.
 * - Unique lowest net wins the pot; any tie carries (no skin awarded).
 * - Standings weight each skin at SKIN_WEIGHT (default ¼ match point).
 */
function calcSkins(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
): PointEvent[] {
  const card = scorecardsByRoundId[round.id]
  if (!card) return []
  const events: PointEvent[] = []
  let pot = 0
  const ids = playerIds()

  card.holesDetail.forEach((hole, i) => {
    const nets = ids.map((id) => ({
      id,
      net: netForHole(scores, hole, i, id),
    }))
    // Wait until the whole group has a net on this hole.
    if (nets.some((n) => n.net == null)) return

    const settled = nets as { id: PlayerId; net: number }[]
    const low = Math.min(...settled.map((n) => n.net))
    const winners = settled.filter((n) => n.net === low).map((n) => n.id)
    pot += 1

    if (winners.length !== 1) {
      // Tie — no skin; pot carries to the next hole.
      return
    }

    const won = pot
    const weighted = won * SKIN_WEIGHT
    const winner = winners[0]
    const netsLabel = settled
      .map((n) => `${playerName(n.id)} ${n.net}`)
      .join(', ')
    events.push({
      roundId: round.id,
      label: `Skin · hole ${hole.number}`,
      detail:
        won > 1
          ? `${playerName(winner)} alone on net (${netsLabel}) · ${won} skins carried`
          : `${playerName(winner)} alone on net (${netsLabel})`,
      points: { [winner]: weighted },
      skinsWon: { [winner]: won },
    })
    pot = 0
  })

  return events
}

function matchPlayResult(
  holes: Hole[],
  scores: Record<PlayerId, HoleScore[]>,
  teamA: [PlayerId, PlayerId],
  teamB: [PlayerId, PlayerId],
  start: number,
  end: number,
): { winner: 'A' | 'B' | 'tie'; holesPlayed: number } {
  let aUp = 0
  let played = 0
  for (let i = start; i < end; i++) {
    const hole = holes[i]
    const a = bestNet(scores, hole, i, teamA)
    const b = bestNet(scores, hole, i, teamB)
    if (a == null || b == null) continue
    played++
    if (a < b) aUp++
    else if (b < a) aUp--
  }
  if (played === 0) return { winner: 'tie', holesPlayed: 0 }
  if (aUp > 0) return { winner: 'A', holesPlayed: played }
  if (aUp < 0) return { winner: 'B', holesPlayed: played }
  return { winner: 'tie', holesPlayed: played }
}

function calcBestBall(
  round: Round,
  game: Extract<RoundGame, { kind: 'best-ball' }>,
  scores: Record<PlayerId, HoleScore[]>,
): PointEvent[] {
  const card = scorecardsByRoundId[round.id]
  if (!card) return []
  const events: PointEvent[] = []
  const holes = card.holesDetail

  const segments =
    game.formatId === 'best-ball-nassau'
      ? [
          { label: 'Nassau front', start: 0, end: 9 },
          { label: 'Nassau back', start: 9, end: 18 },
          { label: 'Nassau overall', start: 0, end: 18 },
        ]
      : [{ label: 'Best ball match', start: 0, end: holes.length }]

  for (const seg of segments) {
    const end = Math.min(seg.end, holes.length)
    const result = matchPlayResult(holes, scores, game.teamA, game.teamB, seg.start, end)
    if (result.holesPlayed === 0) continue
    if (result.winner === 'tie') {
      events.push({
        roundId: round.id,
        label: seg.label,
        detail: `Halved · ${pairLabel(game.teamA)} vs ${pairLabel(game.teamB)}`,
        points: awardSplit([...game.teamA, ...game.teamB], 0.5),
      })
    } else {
      const winners = result.winner === 'A' ? game.teamA : game.teamB
      events.push({
        roundId: round.id,
        label: seg.label,
        detail: `${pairLabel(winners)} win`,
        points: awardSplit([...winners], 1),
      })
    }
  }
  return events
}

function parseHoleRange(label: string): [number, number] | null {
  const m = label.match(/(\d+)\s*[–-]\s*(\d+)/)
  if (!m) return null
  return [Number(m[1]) - 1, Number(m[2])]
}

function calcSixes(
  round: Round,
  game: Extract<RoundGame, { kind: 'sixes-1v1' }>,
  scores: Record<PlayerId, HoleScore[]>,
): PointEvent[] {
  const card = scorecardsByRoundId[round.id]
  if (!card) return []
  const events: PointEvent[] = []

  for (const match of game.matches) {
    const range = parseHoleRange(match.holes)
    if (!range) continue
    const [start, end] = range
    let aUp = 0
    let played = 0
    for (let i = start; i < end; i++) {
      const hole = card.holesDetail[i]
      const a = netForHole(scores, hole, i, match.a)
      const b = netForHole(scores, hole, i, match.b)
      if (a == null || b == null) continue
      played++
      if (a < b) aUp++
      else if (b < a) aUp--
    }
    if (played === 0) continue
    if (aUp === 0) {
      events.push({
        roundId: round.id,
        label: `Sixes ${match.holes}`,
        detail: `${playerName(match.a)} vs ${playerName(match.b)} · halved`,
        points: awardSplit([match.a, match.b], 0.5),
      })
    } else {
      const winner = aUp > 0 ? match.a : match.b
      events.push({
        roundId: round.id,
        label: `Sixes ${match.holes}`,
        detail: `${playerName(winner)} beats ${playerName(aUp > 0 ? match.b : match.a)}`,
        points: { [winner]: 1 },
      })
    }
  }
  return events
}

/**
 * Closest-to-pin: unique lowest gross on the hole wins (score proxy for distance).
 * Misses the green aren't tracked separately — enter only if on/near green if you want.
 */
function calcClosestToPin(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
): PointEvent[] {
  const card = scorecardsByRoundId[round.id]
  if (!card) return []
  const events: PointEvent[] = []
  const ids = playerIds()

  card.holesDetail.forEach((hole, i) => {
    const grosses = ids
      .map((id) => ({ id, g: scores[id]?.[i] ?? null }))
      .filter((x): x is { id: PlayerId; g: number } => x.g != null)
    if (grosses.length < 2) return
    const low = Math.min(...grosses.map((x) => x.g))
    const winners = grosses.filter((x) => x.g === low).map((x) => x.id)
    if (winners.length === 1) {
      events.push({
        roundId: round.id,
        label: `CTP · hole ${hole.number}`,
        detail: playerName(winners[0]),
        points: { [winners[0]]: 1 },
      })
    }
  })
  return events
}

/**
 * Wolf: rotating wolf plays alone vs best net of the other three.
 * Wolf wins hole → 1 pt. Field unique low wins → 1 pt. Ties → no award.
 */
function calcWolf(
  round: Round,
  game: Extract<RoundGame, { kind: 'wolf' }>,
  scores: Record<PlayerId, HoleScore[]>,
): PointEvent[] {
  const card = scorecardsByRoundId[round.id]
  if (!card) return []
  const events: PointEvent[] = []
  const order = game.order

  card.holesDetail.forEach((hole, i) => {
    const wolf = order[i % order.length]
    const field = playerIds().filter((id) => id !== wolf)
    const wolfNet = netForHole(scores, hole, i, wolf)
    const fieldNets = field
      .map((id) => ({ id, net: netForHole(scores, hole, i, id) }))
      .filter((x): x is { id: PlayerId; net: number } => x.net != null)
    if (wolfNet == null || fieldNets.length === 0) return
    const fieldBest = Math.min(...fieldNets.map((f) => f.net))
    if (wolfNet < fieldBest) {
      events.push({
        roundId: round.id,
        label: `Wolf · hole ${hole.number}`,
        detail: `${playerName(wolf)} alone beats field`,
        points: { [wolf]: 1 },
      })
    } else if (fieldBest < wolfNet) {
      const winners = fieldNets.filter((f) => f.net === fieldBest).map((f) => f.id)
      if (winners.length === 1) {
        events.push({
          roundId: round.id,
          label: `Wolf · hole ${hole.number}`,
          detail: `Field · ${playerName(winners[0])} (Wolf ${playerName(wolf)})`,
          points: { [winners[0]]: 1 },
        })
      }
    }
  })
  return events
}

function calcMatchEvents(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
): PointEvent[] {
  const game = round.game
  switch (game.kind) {
    case 'best-ball':
      return calcBestBall(round, game, scores)
    case 'sixes-1v1':
      return calcSixes(round, game, scores)
    case 'closest-to-pin':
      return calcClosestToPin(round, scores)
    case 'wolf':
      return calcWolf(round, game, scores)
    default:
      return []
  }
}

export function calculateRoundResult(
  round: Round,
  allScores: RoundScores,
): RoundResult {
  const card = scorecardsByRoundId[round.id]
  const scores: Record<PlayerId, HoleScore[]> = card
    ? (allScores[round.id] ?? emptyScoresForCard(card))
    : {
        simon: [],
        zach: [],
        emory: [],
        sammy: [],
      }
  const matchEvents = calcMatchEvents(round, scores)
  // Short-course CTP rounds: CTP is the match format — don't double-count skins.
  const skinEvents = round.game.kind === 'closest-to-pin' ? [] : calcSkins(round, scores)

  const matchPoints = zero()
  const skinsWon = zero()
  const skinPoints = zero()
  for (const e of matchEvents) addPoints(matchPoints, e.points)
  for (const e of skinEvents) {
    addPoints(skinPoints, e.points)
    if (e.skinsWon) addPoints(skinsWon, e.skinsWon)
  }

  const total = zero()
  addPoints(total, matchPoints)
  addPoints(total, skinPoints)

  return {
    roundId: round.id,
    course: round.course,
    format: round.game.label,
    events: [...matchEvents, ...skinEvents],
    matchPoints,
    skinsWon,
    skinPoints,
    total,
  }
}

export function calculateTripStandings(allScores: RoundScores): TripStandings {
  const rounds = schedule.map((r) => calculateRoundResult(r, allScores))
  const byPlayer = Object.fromEntries(
    players.map((p) => [
      p.id,
      { match: 0, skins: 0, skinPoints: 0, total: 0, name: p.name },
    ]),
  ) as TripStandings['byPlayer']

  for (const round of rounds) {
    for (const id of playerIds()) {
      byPlayer[id].match += round.matchPoints[id]
      byPlayer[id].skins += round.skinsWon[id]
      byPlayer[id].skinPoints += round.skinPoints[id]
      byPlayer[id].total += round.total[id]
    }
  }

  return { byPlayer, rounds }
}
