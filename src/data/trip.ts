export const players = [
  { id: 'simon', name: 'Simon', handicap: 8.2 },
  { id: 'zach', name: 'Zach', handicap: 12.5 },
  { id: 'emory', name: 'Emory', handicap: 11.7 },
  { id: 'sammy', name: 'Sammy', handicap: 11.5 },
] as const

export type PlayerId = (typeof players)[number]['id']
export type PlayerPair = [PlayerId, PlayerId]
export type Teams = [PlayerPair, PlayerPair]
export type SinglesMatches = [PlayerPair, PlayerPair]
export type SinglesByNine = [SinglesMatches, SinglesMatches]

export type TeamAssignments = {
  /** Randomized Player 1–4 slots; handicap indexes travel with each player. */
  slots: PlayerId[]
  day1: Teams
  day2: Teams
  day3: Teams
}

export type RoundFormatId =
  | 'trails-nassau'
  | 'preserve-singles'
  | 'shortys-combined'
  | 'bandon-best-ball'
  | 'old-mac-singles'
  | 'sheep-st-james'
  | 'pacific-nassau'

type RoundGameBase = {
  formatId: RoundFormatId
  label: string
  blurb: string
}

export type BestBallGame = RoundGameBase & {
  kind: 'best-ball'
  play: 'match' | 'stroke'
  teams: Teams
}

export type SinglesGame = RoundGameBase & {
  kind: 'singles'
  teams: Teams
  matches: { label: string; start: number; end: number; pair: PlayerPair }[]
}

export type CombinedGame = RoundGameBase & {
  kind: 'combined-stroke'
  teams: Teams
}

export type StJamesGame = RoundGameBase & { kind: 'st-james' }
export type RoundGame = BestBallGame | SinglesGame | CombinedGame | StJamesGame

export type Round = {
  id: string
  date: string
  dateLabel: string
  weekday: string
  dayKey: 'day1' | 'day2' | 'day3' | 'day4'
  course: string
  teeTime: string
  shortCourse: boolean
  game: RoundGame
}

export const tripRace = {
  name: 'Trip points',
  description:
    'Every round contributes to the individual trip standings. Main-game points, net Stableford, and the listed side games all update from the shared live scorecard.',
  rules: [
    { title: 'Net Stableford', detail: 'Add net Stableford points over every round. Trip places earn 5 / 2 / 1 points.' },
    { title: 'Net round + birdies', detail: 'Best completed net-to-par round earns 2. Most gross birdies earns 2.' },
    { title: 'Big shots', detail: 'Each eagle earns 5 points. A full-course ace earns 10; an ace at Preserve or Shorty’s earns 5 instead.' },
    { title: 'Closest to the pin', detail: 'Mark the winner on each par 3 at Preserve and Shorty’s. Most across both earns 1 point.' },
  ],
}

function pairKey(pair: PlayerPair) {
  return [...pair].sort().join(':')
}

function teamsKey(teams: Teams) {
  return teams.map((pair) => pairKey(pair)).sort().join('|')
}

function allTeamPairings(slots: PlayerId[]): Teams[] {
  const [a, b, c, d] = slots
  return [
    [[a, b], [c, d]],
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ]
}

function crossings(teams: Teams): SinglesMatches[] {
  const [[a, b], [c, d]] = teams
  return [
    [[a, c], [b, d]],
    [[a, d], [b, c]],
  ]
}

export function defaultTeamAssignments(): TeamAssignments {
  const slots = players.map((player) => player.id)
  const [day1] = allTeamPairings(slots)
  const preserveMatches = crossings(day1)[0]
  const day3: Teams = [preserveMatches[0], preserveMatches[1]]
  const day2 = allTeamPairings(slots).find((pairing) =>
    teamsKey(pairing) !== teamsKey(day1) && teamsKey(pairing) !== teamsKey(day3),
  )!
  return { slots, day1, day2, day3 }
}

function shuffle<T>(values: T[]): T[] {
  const next = [...values]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

/** Rotate all three partner combinations across the first three days. */
export function randomTeamAssignments(): TeamAssignments {
  const slots = shuffle(players.map((player) => player.id))
  const options = shuffle(allTeamPairings(slots))
  const day1 = options[0]
  const preserveMatches = crossings(day1)[Math.floor(Math.random() * 2)]
  const day3: Teams = [preserveMatches[0], preserveMatches[1]]
  const day2 = options.find((pairing) => teamsKey(pairing) !== teamsKey(day1) && teamsKey(pairing) !== teamsKey(day3))!
  return { slots, day1, day2, day3 }
}

export function sameTeamAssignments(a: TeamAssignments, b: TeamAssignments) {
  return JSON.stringify(a) === JSON.stringify(b)
}

const definitions: Omit<Round, 'game'>[] = [
  { id: 'trails', date: '2026-11-15', dateLabel: 'Nov 15', weekday: 'Sunday', dayKey: 'day1', course: 'Bandon Trails', teeTime: '9:50 am', shortCourse: false },
  { id: 'preserve', date: '2026-11-15', dateLabel: 'Nov 15', weekday: 'Sunday', dayKey: 'day1', course: 'Bandon Preserve', teeTime: '3:15 pm', shortCourse: true },
  { id: 'shortys', date: '2026-11-16', dateLabel: 'Nov 16', weekday: 'Monday', dayKey: 'day2', course: "Shorty's", teeTime: '8:30 am', shortCourse: true },
  { id: 'dunes', date: '2026-11-16', dateLabel: 'Nov 16', weekday: 'Monday', dayKey: 'day2', course: 'Bandon Dunes', teeTime: '12:00 pm', shortCourse: false },
  { id: 'pacific', date: '2026-11-17', dateLabel: 'Nov 17', weekday: 'Tuesday', dayKey: 'day3', course: 'Pacific Dunes', teeTime: '7:30 am', shortCourse: false },
  { id: 'old-mac', date: '2026-11-17', dateLabel: 'Nov 17', weekday: 'Tuesday', dayKey: 'day3', course: 'Old Macdonald', teeTime: '1:00 pm', shortCourse: false },
  { id: 'sheep', date: '2026-11-18', dateLabel: 'Nov 18', weekday: 'Wednesday', dayKey: 'day4', course: 'Sheep Ranch', teeTime: '8:30 am', shortCourse: false },
]

export function createSchedule(assignments: TeamAssignments): Round[] {
  const preserveMatches = [assignments.day3[0], assignments.day3[1]] as SinglesMatches
  const oldMacMatchups = crossings(assignments.day3)
  return definitions.map((definition): Round => {
    switch (definition.id) {
      case 'trails':
        return { ...definition, game: { kind: 'best-ball', formatId: 'trails-nassau', label: 'Nassau Best Ball · Match Play', blurb: 'Front nine, back nine, and overall. 8 points in the team pool.', play: 'match', teams: assignments.day1 } }
      case 'preserve':
        return { ...definition, game: { kind: 'singles', formatId: 'preserve-singles', label: 'Two 1v1 Matches', blurb: 'Two 13-hole net matches. Each match is worth 2 points, shared with each winner’s day-one partner.', teams: assignments.day1, matches: preserveMatches.map((pair, i) => ({ label: `Match ${i + 1}`, start: 0, end: 13, pair })) } }
      case 'shortys':
        return { ...definition, game: { kind: 'combined-stroke', formatId: 'shortys-combined', label: 'Net Combined Stroke Play', blurb: 'Add both partners’ net scores on all 19 holes. Winning team earns 4 points.', teams: assignments.day2 } }
      case 'dunes':
        return { ...definition, game: { kind: 'best-ball', formatId: 'bandon-best-ball', label: '18-Hole Best Ball · Match Play', blurb: 'One net best-ball match over 18 holes. Winning pair earns 8 points.', play: 'match', teams: assignments.day2 } }
      case 'old-mac':
        return { ...definition, game: { kind: 'singles', formatId: 'old-mac-singles', label: 'Two 9-Hole Matchball Rounds', blurb: 'Two singles matches per nine. Each match is worth 2 team points, split between partners.', teams: assignments.day3, matches: [...oldMacMatchups[0], ...oldMacMatchups[1]].map((pair, i) => ({ label: `${i < 2 ? 'Front' : 'Back'} 9 · Match ${(i % 2) + 1}`, start: i < 2 ? 0 : 9, end: i < 2 ? 9 : 18, pair })) } }
      case 'sheep':
        return { ...definition, game: { kind: 'st-james', formatId: 'sheep-st-james', label: 'St. James Roll · 6 Dots per Hole', blurb: 'Compare net scores. Earn 1 dot for each opponent beaten outright; tied players do not score against each other, and those dots vanish. Trip finish awards 5 / 2 / 1.' } }
      case 'pacific':
        return { ...definition, game: { kind: 'best-ball', formatId: 'pacific-nassau', label: 'Nassau Best Ball · Stroke Play', blurb: 'Low net best ball by total strokes: 2 front, 2 back, 4 overall.', play: 'stroke', teams: assignments.day3 } }
      default:
        throw new Error(`Missing round definition for ${definition.id}`)
    }
  })
}

export function pairLabel(pair: PlayerPair): string {
  return `${playerName(pair[0])} & ${playerName(pair[1])}`
}

export function roundsByDay(rounds: Round[]) {
  const groups = new Map<string, Round[]>()
  for (const round of rounds) {
    const key = round.date
    groups.set(key, [...(groups.get(key) ?? []), round])
  }
  return [...groups.values()].map((day) => ({ dateLabel: day[0].dateLabel, weekday: day[0].weekday, rounds: day }))
}

export const teamDayLabels = [
  { key: 'day1' as const, label: 'Nov 15 · Trails + Preserve' },
  { key: 'day2' as const, label: 'Nov 16 · Shorty’s + Bandon' },
  { key: 'day3' as const, label: 'Nov 17 · Pacific + Old Mac' },
]

export function teamForPlayer(teams: Teams, playerId: PlayerId): PlayerPair {
  return teams.find((team) => team.includes(playerId)) ?? [playerId, playerId]
}

export function playerName(id: PlayerId) {
  return players.find((player) => player.id === id)?.name ?? id
}

export function playerHandicap(id: PlayerId) {
  return players.find((player) => player.id === id)?.handicap ?? 0
}
