/**
 * Bandon Dunes · Nov 15–18, 2026
 * Simon, Zach, Emory, Sammy — individual points (match wins + skins). No fixed trip teams.
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

/** Individual trip race — no overall teams. */
export const tripRace = {
  name: 'Trip points',
  description:
    'No fixed sides for the week. Everyone banks their own points from match wins and skins across all seven rounds.',
  rules: [
    {
      title: 'Match wins',
      detail:
        'Win a match, Nassau segment, Wolf hole-team, or 6-hole 1v1 → points to you (split if you win as a partner).',
    },
    {
      title: 'Skins',
      detail:
        'Low score alone on a hole takes the skin. Carryovers stack. Short courses (Preserve, Shorty’s) are built for this.',
    },
  ],
}

export type RoundFormatId =
  | 'best-ball-match'
  | 'skins'
  | 'wolf'
  | 'sixes-1v1'
  | 'best-ball-nassau'
  | 'best-ball-sixes'
  | 'finale-skins-match'

type BestBallGame = {
  kind: 'best-ball'
  formatId: RoundFormatId
  label: string
  blurb: string
  teamA: [PlayerId, PlayerId]
  teamB: [PlayerId, PlayerId]
  /** Extra trip scoring note (e.g. skins on the side). */
  pointsNote: string
}

type SkinsGame = {
  kind: 'skins'
  formatId: RoundFormatId
  label: string
  blurb: string
  field: PlayerId[]
  pointsNote: string
}

type WolfGame = {
  kind: 'wolf'
  formatId: RoundFormatId
  label: string
  blurb: string
  /** Tee order — rotates as Wolf each hole. */
  order: PlayerId[]
  pointsNote: string
}

type SixesGame = {
  kind: 'sixes-1v1'
  formatId: RoundFormatId
  label: string
  blurb: string
  matches: { holes: string; a: PlayerId; b: PlayerId }[]
  pointsNote: string
}

export type RoundGame = BestBallGame | SkinsGame | WolfGame | SixesGame

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
      pointsNote: 'Match win → points to the pair. Plus skins on every hole.',
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
      kind: 'skins',
      formatId: 'skins',
      label: 'Skins',
      blurb:
        'Short course — all four play their own ball. Lowest score alone wins the skin; ties carry over.',
      field: ['simon', 'zach', 'emory', 'sammy'],
      pointsNote: 'Each skin → points to that player. Carryovers make late holes matter.',
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
      kind: 'wolf',
      formatId: 'wolf',
      label: 'Wolf',
      blurb:
        'Short course Wolf. Tee order below — that player is Wolf; they go alone or pick a partner after seeing tee shots. Win the hole as Wolf or as a team.',
      order: ['simon', 'zach', 'emory', 'sammy'],
      pointsNote: 'Hole win → points to Wolf (alone) or split with the partner.',
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
      pointsNote: 'Each 6-hole match win → points. Ties split. Skins still count all 18.',
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
      pointsNote: 'Each Nassau segment win → points to that pair. Plus skins.',
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
        'Full-course Wolf with a shuffled tee order. Blind Wolf doubles the hole if you call it before anyone tees.',
      order: ['sammy', 'emory', 'zach', 'simon'],
      pointsNote: 'Hole wins → trip points. Blind Wolf success is worth double.',
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
      formatId: 'finale-skins-match',
      label: 'Finale · Best Ball + Skins',
      blurb:
        'Last pairing of the trip. 18-hole best-ball match, and skins are doubled on the back nine.',
      teamA: ['simon', 'sammy'],
      teamB: ['zach', 'emory'],
      pointsNote: 'Match win → points to the pair. Double skins on 10–18.',
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
