/**
 * Bandon Dunes · Nov 15–18, 2026
 * Update player names here — everything else derives from these ids.
 */
export const players = [
  { id: 'simon', name: 'Simon' },
  { id: 'matt', name: 'Matt' },
  { id: 'ryan', name: 'Ryan' },
  { id: 'dan', name: 'Dan' },
] as const

export type PlayerId = (typeof players)[number]['id']

export function playerName(id: PlayerId): string {
  return players.find((p) => p.id === id)?.name ?? id
}

/** Fixed sides for the week-long Bandon Cup (best ball of these two, every round). */
export const cup = {
  name: 'The Bandon Cup',
  description:
    'Running best-ball match across all seven rounds. Cup sides stay fixed; each round also has its own best-ball game with rotating partners and a different format.',
  teams: [
    {
      id: 'dunes',
      name: 'Team Dunes',
      players: ['simon', 'matt'] as [PlayerId, PlayerId],
    },
    {
      id: 'pacific',
      name: 'Team Pacific',
      players: ['ryan', 'dan'] as [PlayerId, PlayerId],
    },
  ],
  /** How each round feeds the Cup scoreboard. */
  scoring:
    'Each round is worth 1 Cup point (½ each if tied). Cup best-ball is always Simon/Matt vs Ryan/Dan from that round’s scores — even when the day’s side game uses different partners.',
}

export type RoundFormat =
  | 'match-play'
  | 'nassau'
  | 'sixes'
  | 'medal'
  | 'stableford'
  | 'match-presses'
  | 'finale-nassau'

export const formatDetails: Record<
  RoundFormat,
  { label: string; blurb: string }
> = {
  'match-play': {
    label: 'Match Play',
    blurb: 'Best ball vs best ball, hole by hole. Win the hole, win the point.',
  },
  nassau: {
    label: 'Nassau',
    blurb: 'Three best-ball matches in one: front nine, back nine, and overall 18.',
  },
  sixes: {
    label: 'Sixes',
    blurb: 'Three separate best-ball matches — holes 1–6, 7–12, and 13–18.',
  },
  medal: {
    label: 'Medal',
    blurb: 'Straight stroke play. Lowest best-ball total for 18 wins the round.',
  },
  stableford: {
    label: 'Stableford',
    blurb: 'Best-ball Stableford points vs par. Most points after 18 wins.',
  },
  'match-presses': {
    label: 'Match + Presses',
    blurb: '18-hole best-ball match. Automatic 2-down press starts a new match from that hole.',
  },
  'finale-nassau': {
    label: 'Finale Nassau',
    blurb: 'Front, back, and overall — double stakes on the overall. Cup clincher energy.',
  },
}

export type Round = {
  id: string
  date: string
  dateLabel: string
  weekday: string
  course: string
  teeTime: string
  /** Day-game partners (always best ball). Rotates across the trip. */
  sideGame: {
    format: RoundFormat
    teamA: [PlayerId, PlayerId]
    teamB: [PlayerId, PlayerId]
  }
}

export const schedule: Round[] = [
  {
    id: 'trails',
    date: '2026-11-15',
    dateLabel: 'Nov 15',
    weekday: 'Sunday',
    course: 'Bandon Trails',
    teeTime: '9:50 am',
    sideGame: {
      format: 'match-play',
      teamA: ['simon', 'matt'],
      teamB: ['ryan', 'dan'],
    },
  },
  {
    id: 'preserve',
    date: '2026-11-15',
    dateLabel: 'Nov 15',
    weekday: 'Sunday',
    course: 'Bandon Preserve',
    teeTime: '3:15 pm',
    sideGame: {
      format: 'nassau',
      teamA: ['simon', 'ryan'],
      teamB: ['matt', 'dan'],
    },
  },
  {
    id: 'shortys',
    date: '2026-11-16',
    dateLabel: 'Nov 16',
    weekday: 'Monday',
    course: "Shorty's",
    teeTime: '8:30 am',
    sideGame: {
      format: 'medal',
      teamA: ['simon', 'dan'],
      teamB: ['matt', 'ryan'],
    },
  },
  {
    id: 'dunes',
    date: '2026-11-16',
    dateLabel: 'Nov 16',
    weekday: 'Monday',
    course: 'Bandon Dunes',
    teeTime: '12:00 pm',
    sideGame: {
      format: 'sixes',
      teamA: ['simon', 'matt'],
      teamB: ['ryan', 'dan'],
    },
  },
  {
    id: 'pacific',
    date: '2026-11-17',
    dateLabel: 'Nov 17',
    weekday: 'Tuesday',
    course: 'Pacific Dunes',
    teeTime: '7:30 am',
    sideGame: {
      format: 'match-presses',
      teamA: ['simon', 'ryan'],
      teamB: ['matt', 'dan'],
    },
  },
  {
    id: 'old-mac',
    date: '2026-11-17',
    dateLabel: 'Nov 17',
    weekday: 'Tuesday',
    course: 'Old McDonald',
    teeTime: '1:00 pm',
    sideGame: {
      format: 'stableford',
      teamA: ['simon', 'dan'],
      teamB: ['matt', 'ryan'],
    },
  },
  {
    id: 'sheep',
    date: '2026-11-18',
    dateLabel: 'Nov 18',
    weekday: 'Wednesday',
    course: 'Sheep Ranch',
    teeTime: '8:30 am',
    sideGame: {
      format: 'finale-nassau',
      teamA: ['simon', 'matt'],
      teamB: ['ryan', 'dan'],
    },
  },
]

export function pairLabel(pair: [PlayerId, PlayerId]): string {
  return `${playerName(pair[0])} & ${playerName(pair[1])}`
}

export function roundsByDay(): { dateLabel: string; weekday: string; rounds: Round[] }[] {
  const order: string[] = []
  const map = new Map<string, Round[]>()
  for (const round of schedule) {
    const key = round.date
    if (!map.has(key)) {
      order.push(key)
      map.set(key, [])
    }
    map.get(key)!.push(round)
  }
  return order.map((date) => {
    const rounds = map.get(date)!
    return {
      dateLabel: rounds[0].dateLabel,
      weekday: rounds[0].weekday,
      rounds,
    }
  })
}
