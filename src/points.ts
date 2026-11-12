import { scorecardsByRoundId, type Hole } from './data/scorecards'
import {
  playerName,
  players,
  teamForPlayer,
  type PlayerId,
  type PlayerPair,
  type Round,
  type Teams,
} from './data/trip'
import {
  emptyScoresForCard,
  netScore,
  playerIds,
  type ClosestToPinScores,
  type HoleScore,
  type RoundScores,
} from './scoring'

export type PointEvent = {
  roundId: string
  label: string
  detail: string
  points: Partial<Record<PlayerId, number>>
}

export type RoundResult = {
  roundId: string
  course: string
  format: string
  events: PointEvent[]
  points: Record<PlayerId, number>
  stableford: Record<PlayerId, number>
  stJamesDots: Record<PlayerId, number>
  grossBirdies: Record<PlayerId, number>
  eagles: Record<PlayerId, number>
  holesInOne: Record<PlayerId, number>
  netToPar: Record<PlayerId, number | null>
  complete: Record<PlayerId, boolean>
}

export type TripStandings = {
  byPlayer: Record<
    PlayerId,
    {
      round: number
      side: number
      stableford: number
      grossBirdies: number
      eagles: number
      holesInOne: number
      closestToPin: number
      bestNetRound: number | null
      total: number
      name: string
    }
  >
  rounds: RoundResult[]
}

export const ROUND_POINT_TOTALS: Partial<Record<Round['game']['formatId'], number>> = {
  'trails-nassau': 8,
  'preserve-singles': 4,
  'shortys-combined': 4,
  'bandon-best-ball': 8,
  'old-mac-singles': 8,
  'sheep-st-james': 8,
  'pacific-nassau': 8,
}

function zero(): Record<PlayerId, number> {
  return { simon: 0, zach: 0, emory: 0, sammy: 0 }
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

function addPoints(target: Record<PlayerId, number>, source: Partial<Record<PlayerId, number>>) {
  for (const id of playerIds()) target[id] += source[id] ?? 0
}

function holeNet(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
  hole: Hole,
  holeIndex: number,
  playerId: PlayerId,
) {
  const card = scorecardsByRoundId[round.id]
  return card ? netScore(playerId, hole, scores[playerId]?.[holeIndex] ?? null, card) : null
}

function teamNet(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
  hole: Hole,
  holeIndex: number,
  team: PlayerPair,
) {
  const nets = team.map((id) => holeNet(round, scores, hole, holeIndex, id))
  const played = nets.filter((score): score is number => score != null)
  return played.length ? Math.min(...played) : null
}

function allHaveScore(scores: Record<PlayerId, HoleScore[]>, ids: PlayerId[], index: number) {
  return ids.every((id) => scores[id]?.[index] != null)
}

function addTeamWin(points: Record<PlayerId, number>, teams: Teams, winner: 0 | 1 | null, amount: number) {
  for (const side of [0, 1] as const) {
    const sideAmount = winner == null ? amount / 2 : winner === side ? amount : 0
    for (const id of teams[side]) points[id] += sideAmount / 2
  }
}

function matchResult(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
  teams: Teams,
  start: number,
  end: number,
  pointValue: number,
  label: string,
  mode: 'match' | 'stroke',
): PointEvent | null {
  const card = scorecardsByRoundId[round.id]
  if (!card) return null
  let a = 0
  let b = 0
  let holesPlayed = 0
  const scoreA: number[] = []
  const scoreB: number[] = []
  const allIds = [...teams[0], ...teams[1]]
  for (let index = start; index < Math.min(end, card.holesDetail.length); index++) {
    if (!allHaveScore(scores, allIds, index)) continue
    holesPlayed++
    const netA = teamNet(round, scores, card.holesDetail[index], index, teams[0])!
    const netB = teamNet(round, scores, card.holesDetail[index], index, teams[1])!
    scoreA.push(netA)
    scoreB.push(netB)
    if (mode === 'match') {
      if (netA < netB) a++
      else if (netB < netA) b++
    }
  }
  if (!holesPlayed) return null
  if (mode === 'stroke') {
    a = sum(scoreA)
    b = sum(scoreB)
  }
  const winner: 0 | 1 | null = a < b ? 0 : b < a ? 1 : null
  const points = zero()
  addTeamWin(points, teams, winner, pointValue)
  const detail = mode === 'match'
    ? `${teams[0].map(playerName).join(' & ')} ${a} · ${teams[1].map(playerName).join(' & ')} ${b} (${holesPlayed} holes)`
    : `${teams[0].map(playerName).join(' & ')} ${a} · ${teams[1].map(playerName).join(' & ')} ${b} net (${holesPlayed} holes)`
  return { roundId: round.id, label, detail, points }
}

function singleMatch(
  round: Round,
  scores: Record<PlayerId, HoleScore[]>,
  teams: Teams,
  pair: PlayerPair,
  start: number,
  end: number,
  label: string,
  pointValue: number,
): PointEvent | null {
  const card = scorecardsByRoundId[round.id]
  if (!card) return null
  const [a, b] = pair
  let aUp = 0
  let played = 0
  for (let index = start; index < Math.min(end, card.holesDetail.length); index++) {
    if (!allHaveScore(scores, pair, index)) continue
    played++
    const scoreA = holeNet(round, scores, card.holesDetail[index], index, a)!
    const scoreB = holeNet(round, scores, card.holesDetail[index], index, b)!
    if (scoreA < scoreB) aUp++
    else if (scoreB < scoreA) aUp--
  }
  if (!played) return null
  const teamA = teamForPlayer(teams, a)
  const teamB = teamForPlayer(teams, b)
  const winner = aUp > 0 ? 0 : aUp < 0 ? 1 : null
  const points = zero()
  addTeamWin(points, [teamA, teamB], winner, pointValue)
  return {
    roundId: round.id,
    label,
    detail: `${playerName(a)} vs ${playerName(b)} · ${Math.abs(aUp)} up${winner == null ? ' · halved' : ''} (${played} holes)`,
    points,
  }
}

function awardPlaces(values: Array<{ id: PlayerId; score: number }>, prizes: number[], lowWins = false) {
  const eligible = values.filter(({ score }) => Number.isFinite(score))
  const sorted = [...eligible].sort((a, b) => lowWins ? a.score - b.score : b.score - a.score)
  const awards = zero()
  let position = 0
  while (position < sorted.length && position < prizes.length) {
    let end = position + 1
    while (end < sorted.length && sorted[end].score === sorted[position].score) end++
    const pool = sum(prizes.slice(position, Math.min(end, prizes.length)))
    for (const entry of sorted.slice(position, end)) awards[entry.id] += pool / (end - position)
    position = end
  }
  return awards
}

function roundResult(round: Round, allScores: RoundScores): RoundResult {
  const card = scorecardsByRoundId[round.id]
  const scores = card ? (allScores[round.id] ?? emptyScoresForCard(card)) : emptyScoresForCard({
    id: round.id, name: round.course, holes: 0, par: 0, tee: '', source: '', holesDetail: [],
  })
  const points = zero()
  const events: PointEvent[] = []
  const stableford = zero()
  const stJamesDots = zero()
  const grossBirdies = zero()
  const eagles = zero()
  const holesInOne = zero()
  const netToPar: Record<PlayerId, number | null> = { simon: null, zach: null, emory: null, sammy: null }
  const complete: Record<PlayerId, boolean> = { simon: false, zach: false, emory: false, sammy: false }

  if (card) {
    for (const id of playerIds()) {
      let played = 0
      let netTotal = 0
      let parTotal = 0
      card.holesDetail.forEach((hole, index) => {
        const gross = scores[id]?.[index]
        if (gross == null) return
        played++
        parTotal += hole.par
        const net = netScore(id, hole, gross, card)!
        netTotal += net
        const relative = net - hole.par
        stableford[id] += relative <= -4 ? 6 : relative === -3 ? 5 : relative === -2 ? 4 : relative === -1 ? 3 : relative === 0 ? 2 : relative === 1 ? 1 : 0
        if (gross === hole.par - 1) grossBirdies[id]++
        if (gross === hole.par - 2) eagles[id]++
        if (gross === 1) holesInOne[id]++
      })
      complete[id] = played === card.holes
      if (played) netToPar[id] = netTotal - parTotal
    }
  }

  if (round.game.kind === 'best-ball') {
    const segments = round.game.formatId === 'trails-nassau' || round.game.formatId === 'pacific-nassau'
      ? [
          { label: 'Front 9', start: 0, end: 9, points: 2 },
          { label: 'Back 9', start: 9, end: 18, points: 2 },
          { label: 'Overall', start: 0, end: 18, points: 4 },
        ]
      : [{ label: '18-hole match', start: 0, end: 18, points: 8 }]
    for (const segment of segments) {
      const event = matchResult(round, scores, round.game.teams, segment.start, segment.end, segment.points, segment.label, round.game.play)
      if (event) events.push(event)
    }
  }

  if (round.game.kind === 'singles') {
    for (const match of round.game.matches) {
      const event = singleMatch(round, scores, round.game.teams, match.pair, match.start, match.end, `${match.label} · ${playerName(match.pair[0])} vs ${playerName(match.pair[1])}`, 2)
      if (event) events.push(event)
    }
  }

  if (round.game.kind === 'combined-stroke' && card) {
    const teams = round.game.teams
    const totals = [0, 0]
    let played = 0
    card.holesDetail.forEach((hole, index) => {
      if (!allHaveScore(scores, [...teams[0], ...teams[1]], index)) return
      played++
      totals[0] += teams[0].reduce((n, id) => n + netScore(id, hole, scores[id][index], card)!, 0)
      totals[1] += teams[1].reduce((n, id) => n + netScore(id, hole, scores[id][index], card)!, 0)
    })
    if (played) {
      const winner: 0 | 1 | null = totals[0] < totals[1] ? 0 : totals[1] < totals[0] ? 1 : null
      const eventPoints = zero()
      addTeamWin(eventPoints, teams, winner, 4)
      events.push({ roundId: round.id, label: 'Combined net strokes', detail: `${totals[0]} · ${totals[1]} net (${played} holes)`, points: eventPoints })
    }
  }

  if (round.game.kind === 'st-james' && card) {
    let playedHoles = 0
    card.holesDetail.forEach((hole, index) => {
      if (!allHaveScore(scores, playerIds(), index)) return
      playedHoles++
      const nets = playerIds().map((id) => ({ id, score: netScore(id, hole, scores[id][index], card)! }))
      const holeDots = zero()
      for (const player of nets) {
        holeDots[player.id] = nets.filter((opponent) => opponent.id !== player.id && opponent.score > player.score).length
        stJamesDots[player.id] += holeDots[player.id]
      }
      events.push({
        roundId: round.id,
        label: `Hole ${hole.number} · St. James dots`,
        detail: nets.map(({ id }) => `${playerName(id)} ${holeDots[id]}`).join(' · '),
        points: {},
      })
    })
    const totals = playerIds().map((id) => ({ id, score: stJamesDots[id] }))
    if (playedHoles) {
      const eventPoints = awardPlaces(totals, [5, 2, 1])
      events.push({
        roundId: round.id,
        label: 'St. James Roll · 6 dots per hole',
        detail: `${playedHoles} holes · ${totals.map(({ id, score }) => `${playerName(id)} ${score}`).join(' · ')} · trip finish 5 / 2 / 1`,
        points: eventPoints,
      })
    }
  }

  for (const event of events) addPoints(points, event.points)
  return { roundId: round.id, course: round.course, format: round.game.label, events, points, stableford, stJamesDots, grossBirdies, eagles, holesInOne, netToPar, complete }
}

export function calculateRoundResult(round: Round, allScores: RoundScores) {
  return roundResult(round, allScores)
}

export function calculateTripStandings(
  allScores: RoundScores,
  closestToPin: ClosestToPinScores,
  rounds: Round[],
): TripStandings {
  const roundResults = rounds.map((round) => roundResult(round, allScores))
  const byPlayer = Object.fromEntries(players.map((player) => [player.id, {
    round: 0,
    side: 0,
    stableford: 0,
    grossBirdies: 0,
    eagles: 0,
    holesInOne: 0,
    closestToPin: 0,
    bestNetRound: null,
    total: 0,
    name: player.name,
  }])) as TripStandings['byPlayer']

  for (const result of roundResults) {
    for (const id of playerIds()) {
      byPlayer[id].round += result.points[id]
      byPlayer[id].stableford += result.stableford[id]
      byPlayer[id].grossBirdies += result.grossBirdies[id]
      byPlayer[id].eagles += result.eagles[id]
      byPlayer[id].holesInOne += result.holesInOne[id]
      if (result.complete[id] && result.netToPar[id] != null) {
        const previous = byPlayer[id].bestNetRound
        byPlayer[id].bestNetRound = previous == null ? result.netToPar[id] : Math.min(previous, result.netToPar[id]!)
      }
    }
    for (const round of rounds) {
      if (round.id !== result.roundId) continue
      if (round.id !== 'preserve' && round.id !== 'shortys') continue
      for (const winner of closestToPin[round.id] ?? []) if (winner) byPlayer[winner].closestToPin++
    }
  }

  const tripHasScores = Object.values(allScores).some((rows) => Object.values(rows).some((holes) => holes.some((score) => score != null)))
  if (tripHasScores) addPointsToSide(byPlayer, awardPlaces(players.map(({ id }) => ({ id, score: byPlayer[id].stableford })), [5, 2, 1]))

  const bestRounds = players.flatMap(({ id }) => byPlayer[id].bestNetRound == null ? [] : [{ id, score: byPlayer[id].bestNetRound! }])
  if (bestRounds.length) addPointsToSide(byPlayer, awardPlaces(bestRounds, [2], true))
  if (Math.max(...players.map(({ id }) => byPlayer[id].grossBirdies)) > 0) {
    addPointsToSide(byPlayer, awardPlaces(players.map(({ id }) => ({ id, score: byPlayer[id].grossBirdies })), [2]))
  }
  const maxCtp = Math.max(...players.map(({ id }) => byPlayer[id].closestToPin))
  if (maxCtp > 0) addPointsToSide(byPlayer, awardPlaces(players.map(({ id }) => ({ id, score: byPlayer[id].closestToPin })), [1]))
  for (const id of playerIds()) {
    byPlayer[id].side += byPlayer[id].eagles * 5
    byPlayer[id].side += byPlayer[id].holesInOne * 10
    byPlayer[id].side += roundResults.filter((result) => result.roundId === 'shortys').reduce((n, result) => n + result.holesInOne[id] * 5, 0)
    byPlayer[id].total = byPlayer[id].round + byPlayer[id].side
  }
  return { byPlayer, rounds: roundResults }
}

function addPointsToSide(byPlayer: TripStandings['byPlayer'], points: Record<PlayerId, number>) {
  for (const id of playerIds()) byPlayer[id].side += points[id]
}
