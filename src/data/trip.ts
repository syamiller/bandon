/**
 * Bandon Dunes · Nov 15–18, 2026
 * Simon, Zach, Emory, Sammy — individual points (match wins + skins). No fixed trip teams.
 * Skins run every round; round games below are the match format only.
 */
export const players = [
  { id: 'simon', name: 'Simon' },
  { id: 'zach', name: 'Zach' },
  { id: 'emory', name: 'Emory' },
  { id: 'sammy', name: 'Sammy' },
] as const

export type PlayerId = (typeof players)[number]['id']

export function playerName(id: PlayerId): string {
  return players.find((p) => p.id === id)?.name ?? id
}

export function pairLabel(pair: [PlayerId, PlayerId]): string {
  return `${playerName(pair[0])} & ${playerName(pair[1])}`
}

/** Individual trip race — no overall teams. Skins are every round. */
export const tripRace = {
  name: 'Trip points',
  description:
    'No fixed sides for the week. Everyone banks their own points from match wins — and skins on every hole, every round.',
  rules: [
    {
      title: 'Match wins',
      detail:
        'Win a match, Nassau segment, Wolf hole-team, 6-hole 1v1, or closest-to-the-pin hole → points to you (split if you win as a partner).',
    },
    {
      title: 'Skins',
      detail:
        'Every round. Low score alone on a hole takes the skin; ties carry over.',
    },
  ],
}

export type RoundFormatId =
  | 'best-ball-match'
  | 'closest-to-pin'
  | 'wolf'
  | 'sixes-1v1'
  | 'best-ball-nassau'
  | 'finale-best-ball'

type BestBallGame = {
  kind: 'best-ball'
  formatId: RoundFormatId
  label: string
  blurb: string
  teamA: [PlayerId, PlayerId]
  teamB: [PlayerId, PlayerId]
}

type ClosestToPinGame = {
  kind: 'closest-to-pin'
  formatId: RoundFormatId
  label: string
  blurb: string
  field: PlayerId[]
}

type WolfGame = {
  kind: 'wolf'
  formatId: RoundFormatId
  label: string
  blurb: string
  /** Tee order — rotates as Wolf each hole. */
  order: PlayerId[]
}

type SixesGame = {
  kind: 'sixes-1v1'
  formatId: RoundFormatId
  label: string
  blurb: string
  matches: { holes: string; a: PlayerId; b: PlayerId }[]
}

export type RoundGame = BestBallGame | ClosestToPinGame | WolfGame | SixesGame

export type Round = {
  id: string
  date: string
  dateLabel: string
  weekday: string
  course: string
  teeTime: string
  /** Preserve + Shorty’s are the resort’s short / par-3 tracks. */
  shortCourse: boolean
  game: RoundGame
}

export const schedule: Round[] = [
  {
    id: 'trails',
    date: '2026-11-15',
    dateLabel: 'Nov 15',
    weekday: 'Sunday',
    course: 'Bandon Trails',
    teeTime: '9:50 am',
    shortCourse: false,
    game: {
      kind: 'best-ball',
      formatId: 'best-ball-match',
      label: 'Best Ball Match',
      blurb: '2v2 best ball, hole by hole. Open the trip with partners.',
      teamA: ['simon', 'zach'],
      teamB: ['emory', 'sammy'],
    },
  },
  {
    id: 'preserve',
    date: '2026-11-15',
    dateLabel: 'Nov 15',
    weekday: 'Sunday',
    course: 'Bandon Preserve',
    teeTime: '3:15 pm',
    shortCourse: true,
    game: {
      kind: 'closest-to-pin',
      formatId: 'closest-to-pin',
      label: 'Closest to the Pin',
      blurb:
        'Short course — every hole is a closest-to-the-pin. Closest ball on the green takes the hole.',
      field: ['simon', 'zach', 'emory', 'sammy'],
    },
  },
  {
    id: 'shortys',
    date: '2026-11-16',
    dateLabel: 'Nov 16',
    weekday: 'Monday',
    course: "Shorty's",
    teeTime: '8:30 am',
    shortCourse: true,
    game: {
      kind: 'closest-to-pin',
      formatId: 'closest-to-pin',
      label: 'Closest to the Pin',
      blurb:
        'Short course — closest to the hole on every hole. Miss the green and you’re out for that hole.',
      field: ['simon', 'zach', 'emory', 'sammy'],
    },
  },
  {
    id: 'dunes',
    date: '2026-11-16',
    dateLabel: 'Nov 16',
    weekday: 'Monday',
    course: 'Bandon Dunes',
    teeTime: '12:00 pm',
    shortCourse: false,
    game: {
      kind: 'sixes-1v1',
      formatId: 'sixes-1v1',
      label: 'Sixes · 1v1',
      blurb:
        'Three 6-hole matches. Everyone plays everyone — fresh opponent each six.',
      matches: [
        { holes: '1–6', a: 'simon', b: 'zach' },
        { holes: '1–6', a: 'emory', b: 'sammy' },
        { holes: '7–12', a: 'simon', b: 'emory' },
        { holes: '7–12', a: 'zach', b: 'sammy' },
        { holes: '13–18', a: 'simon', b: 'sammy' },
        { holes: '13–18', a: 'zach', b: 'emory' },
      ],
    },
  },
  {
    id: 'pacific',
    date: '2026-11-17',
    dateLabel: 'Nov 17',
    weekday: 'Tuesday',
    course: 'Pacific Dunes',
    teeTime: '7:30 am',
    shortCourse: false,
    game: {
      kind: 'best-ball',
      formatId: 'best-ball-nassau',
      label: 'Best Ball Nassau',
      blurb: 'New partners. Front nine, back nine, and overall — three matches in one.',
      teamA: ['simon', 'emory'],
      teamB: ['zach', 'sammy'],
    },
  },
  {
    id: 'old-mac',
    date: '2026-11-17',
    dateLabel: 'Nov 17',
    weekday: 'Tuesday',
    course: 'Old McDonald',
    teeTime: '1:00 pm',
    shortCourse: false,
    game: {
      kind: 'wolf',
      formatId: 'wolf',
      label: 'Wolf',
      blurb:
        'Full-course Wolf. Tee order below — that player is Wolf; they go alone or pick a partner after seeing tee shots. Blind Wolf doubles if you call it before anyone tees.',
      order: ['sammy', 'emory', 'zach', 'simon'],
    },
  },
  {
    id: 'sheep',
    date: '2026-11-18',
    dateLabel: 'Nov 18',
    weekday: 'Wednesday',
    course: 'Sheep Ranch',
    teeTime: '8:30 am',
    shortCourse: false,
    game: {
      kind: 'best-ball',
      formatId: 'finale-best-ball',
      label: 'Finale · Best Ball Match',
      blurb: 'Last pairing of the trip. Straight 18-hole best-ball match.',
      teamA: ['simon', 'sammy'],
      teamB: ['zach', 'emory'],
    },
  },
]

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
