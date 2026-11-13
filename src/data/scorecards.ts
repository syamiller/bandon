/**
 * Course scorecards for the Nov 2026 Bandon trip.
 * Pars + men’s stroke indexes + Green (or Back) yardages from GolfPass / resort data.
 * Sources noted per course — verify on-site if the resort reprints a card.
 */

export type Hole = {
  number: number
  par: number
  /** Men’s stroke index (1 = hardest). */
  strokeIndex: number
  yards: number
}

export type TeeOption = {
  id: string
  name: string
  rating: number
  slope: number
  ratingPar: number
  ratingHoles?: number
}

export type Scorecard = {
  id: string
  name: string
  holes: number
  par: number
  tee: string
  rating?: number
  slope?: number
  /** Course-rating par and rated hole count for GHIN course-handicap conversion. */
  ratingPar?: number
  ratingHoles?: number
  teeOptions: TeeOption[]
  source: string
  holesDetail: Hole[]
}

function card(
  meta: Omit<Scorecard, 'holesDetail' | 'holes' | 'par' | 'teeOptions'> & { teeOptions?: TeeOption[] },
  rows: [number, number, number][], // par, SI, yards
): Scorecard {
  const holesDetail = rows.map(([par, strokeIndex, yards], i) => ({
    number: i + 1,
    par,
    strokeIndex,
    yards,
  }))
  return {
    ...meta,
    teeOptions: meta.teeOptions ?? (meta.rating != null && meta.slope != null ? [{
      id: meta.tee.toLowerCase().replaceAll(' ', '-'),
      name: meta.tee,
      rating: meta.rating,
      slope: meta.slope,
      ratingPar: meta.ratingPar ?? holesDetail.reduce((total, hole) => total + hole.par, 0),
      ratingHoles: meta.ratingHoles ?? holesDetail.length,
    }] : []),
    holes: holesDetail.length,
    par: holesDetail.reduce((s, h) => s + h.par, 0),
    holesDetail,
  }
}

/** Bandon Trails — Green tees. GolfPass course 19109. */
export const trails = card(
  {
    id: 'trails',
    name: 'Bandon Trails',
    tee: 'Green',
    rating: 71.1,
    slope: 129,
    ratingPar: 71,
    ratingHoles: 18,
    teeOptions: [
      { id: 'black', name: 'Black', rating: 73.6, slope: 130, ratingPar: 71 },
      { id: 'green', name: 'Green', rating: 71.1, slope: 129, ratingPar: 71 },
      { id: 'gold', name: 'Gold', rating: 68.7, slope: 122, ratingPar: 71 },
      { id: 'orange', name: 'Orange', rating: 66.1, slope: 117, ratingPar: 71 },
      { id: 'royal-blue', name: 'Royal Blue', rating: 61.2, slope: 105, ratingPar: 71 },
    ],
    source: 'GolfPass / Bandon Trails scorecard',
  },
  [
    [4, 13, 356],
    [3, 17, 166],
    [5, 3, 532],
    [4, 5, 365],
    [3, 15, 124],
    [4, 9, 359],
    [4, 7, 406],
    [4, 11, 299],
    [5, 1, 522],
    [4, 10, 393],
    [4, 4, 429],
    [3, 18, 235],
    [4, 12, 374],
    [4, 14, 306],
    [4, 8, 367],
    [5, 2, 494],
    [3, 16, 159],
    [4, 6, 363],
  ],
)

/**
 * Bandon Preserve — 13-hole par-3, Back tees.
 * Yardages from official resort hole list (sum 1609). Stroke indexes from GolfPass
 * holes 1–13, renormed to 1–13 for short-course play.
 */
export const preserve = card(
  {
    id: 'preserve',
    name: 'Bandon Preserve',
    tee: 'Back',
    rating: 53.1,
    slope: 105,
    ratingPar: 54,
    ratingHoles: 18,
    teeOptions: [
      { id: 'back', name: 'Back', rating: 53.1, slope: 105, ratingPar: 54, ratingHoles: 18 },
      { id: 'front', name: 'Front', rating: 53.0, slope: 103, ratingPar: 54, ratingHoles: 18 },
    ],
    source: 'Bandon Dunes Golf Resort + GolfPass (13-hole card)',
  },
  [
    [3, 10, 134],
    [3, 11, 150],
    [3, 3, 87],
    [3, 4, 118],
    [3, 1, 142],
    [3, 12, 131],
    [3, 6, 147],
    [3, 9, 63],
    [3, 8, 134],
    [3, 7, 120],
    [3, 2, 142],
    [3, 13, 132],
    [3, 5, 109],
  ],
)

/**
 * Shorty’s — 19-hole par-3. Holes 1–18 from GolfPass; hole 19 (~57 yds) from course reviews.
 * Stroke indexes 1–18 from GolfPass; 19 = easiest.
 */
export const shortys = card(
  {
    id: 'shortys',
    name: "Shorty's",
    tee: 'Back',
    rating: 56.2,
    slope: 87,
    ratingPar: 54,
    ratingHoles: 18,
    teeOptions: [
      { id: 'back', name: 'Back', rating: 56.2, slope: 87, ratingPar: 54, ratingHoles: 18 },
      { id: 'middle', name: 'Middle', rating: 52.1, slope: 85, ratingPar: 54, ratingHoles: 18 },
      { id: 'front', name: 'Front', rating: 54.0, slope: 88, ratingPar: 54, ratingHoles: 18 },
    ],
    source: "GolfPass Shorty's card + hole 19 from course reviews",
  },
  [
    [3, 1, 119],
    [3, 3, 124],
    [3, 5, 85],
    [3, 7, 80],
    [3, 9, 117],
    [3, 11, 84],
    [3, 13, 114],
    [3, 15, 104],
    [3, 17, 72],
    [3, 2, 101],
    [3, 4, 148],
    [3, 6, 133],
    [3, 8, 152],
    [3, 10, 161],
    [3, 12, 51],
    [3, 14, 123],
    [3, 16, 80],
    [3, 18, 92],
    [3, 19, 57],
  ],
)

/** Bandon Dunes — Green tees. GolfPass course 14615. */
export const dunes = card(
  {
    id: 'dunes',
    name: 'Bandon Dunes',
    tee: 'Green',
    rating: 71.4,
    slope: 133,
    ratingPar: 72,
    ratingHoles: 18,
    teeOptions: [
      { id: 'tournament', name: 'Tournament', rating: 75.9, slope: 145, ratingPar: 72 },
      { id: 'black', name: 'Black', rating: 73.5, slope: 143, ratingPar: 72 },
      { id: 'green', name: 'Green', rating: 71.4, slope: 133, ratingPar: 72 },
      { id: 'gold', name: 'Gold', rating: 69.1, slope: 124, ratingPar: 72 },
      { id: 'orange', name: 'Orange', rating: 65.5, slope: 114, ratingPar: 72 },
      { id: 'royal-blue', name: 'Royal Blue', rating: 61.6, slope: 105, ratingPar: 72 },
    ],
    source: 'GolfPass / Bandon Dunes scorecard',
  },
  [
    [4, 13, 352],
    [3, 15, 155],
    [5, 3, 489],
    [4, 5, 362],
    [4, 1, 400],
    [3, 17, 153],
    [4, 7, 372],
    [4, 11, 342],
    [5, 9, 520],
    [4, 8, 339],
    [4, 2, 351],
    [3, 18, 153],
    [5, 6, 537],
    [4, 16, 332],
    [3, 14, 131],
    [4, 10, 345],
    [4, 12, 375],
    [5, 4, 513],
  ],
)

/** Pacific Dunes — Green tees. GolfPass course 19110. */
export const pacific = card(
  {
    id: 'pacific',
    name: 'Pacific Dunes',
    tee: 'Green',
    rating: 70.8,
    slope: 135,
    ratingPar: 71,
    ratingHoles: 18,
    teeOptions: [
      { id: 'black', name: 'Black', rating: 73.2, slope: 143, ratingPar: 71 },
      { id: 'green', name: 'Green', rating: 70.8, slope: 135, ratingPar: 71 },
      { id: 'gold', name: 'Gold', rating: 68.9, slope: 131, ratingPar: 71 },
      { id: 'orange', name: 'Orange', rating: 65.8, slope: 126, ratingPar: 71 },
      { id: 'royal-blue', name: 'Royal Blue', rating: 61.5, slope: 113, ratingPar: 71 },
    ],
    source: 'GolfPass / Pacific Dunes scorecard',
  },
  [
    [4, 9, 304],
    [4, 11, 335],
    [5, 7, 476],
    [4, 3, 449],
    [3, 17, 181],
    [4, 13, 288],
    [4, 1, 436],
    [4, 5, 369],
    [4, 15, 379],
    [3, 14, 163],
    [3, 18, 131],
    [5, 6, 507],
    [4, 2, 390],
    [3, 16, 128],
    [5, 10, 504],
    [4, 12, 338],
    [3, 8, 189],
    [5, 4, 575],
  ],
)

/** Old Macdonald — Green tees. GolfPass course 22600. */
export const oldMac = card(
  {
    id: 'old-mac',
    name: 'Old McDonald',
    tee: 'Green',
    rating: 71.4,
    slope: 127,
    ratingPar: 71,
    ratingHoles: 18,
    teeOptions: [
      { id: 'black', name: 'Black', rating: 74.4, slope: 134, ratingPar: 71 },
      { id: 'green', name: 'Green', rating: 71.4, slope: 127, ratingPar: 71 },
      { id: 'gold', name: 'Gold', rating: 67.8, slope: 117, ratingPar: 71 },
      { id: 'orange', name: 'Orange', rating: 65.1, slope: 112, ratingPar: 71 },
      { id: 'royal-blue', name: 'Royal Blue', rating: 62.6, slope: 104, ratingPar: 71 },
    ],
    source: 'GolfPass / Old Macdonald scorecard',
  },
  [
    [4, 11, 304],
    [3, 15, 162],
    [4, 9, 345],
    [4, 1, 472],
    [3, 17, 134],
    [5, 3, 520],
    [4, 5, 345],
    [3, 13, 170],
    [4, 7, 352],
    [4, 6, 440],
    [4, 4, 399],
    [3, 16, 205],
    [4, 18, 319],
    [4, 14, 297],
    [5, 12, 482],
    [4, 2, 433],
    [5, 10, 515],
    [4, 8, 426],
  ],
)

/** Sheep Ranch — Green tees. GolfPass course 34922. */
export const sheep = card(
  {
    id: 'sheep',
    name: 'Sheep Ranch',
    tee: 'Green',
    rating: 70.2,
    slope: 119,
    ratingPar: 72,
    ratingHoles: 18,
    teeOptions: [
      { id: 'black', name: 'Black', rating: 72.1, slope: 122, ratingPar: 72 },
      { id: 'green', name: 'Green', rating: 70.2, slope: 119, ratingPar: 72 },
      { id: 'gold', name: 'Gold', rating: 68.1, slope: 111, ratingPar: 72 },
      { id: 'orange', name: 'Orange', rating: 65.2, slope: 105, ratingPar: 72 },
      { id: 'royal-blue', name: 'Royal Blue', rating: 61.0, slope: 96, ratingPar: 72 },
    ],
    source: 'GolfPass / Sheep Ranch scorecard',
  },
  [
    [5, 5, 517],
    [4, 13, 303],
    [3, 17, 113],
    [4, 3, 443],
    [3, 11, 166],
    [4, 1, 431],
    [3, 15, 138],
    [4, 7, 407],
    [4, 9, 386],
    [4, 6, 375],
    [5, 4, 506],
    [4, 2, 414],
    [5, 10, 485],
    [4, 8, 377],
    [4, 14, 303],
    [3, 16, 131],
    [4, 12, 314],
    [5, 18, 436],
  ],
)

/** Keyed by trip round id (same as schedule[].id). */
export const scorecardsByRoundId: Record<string, Scorecard> = {
  trails,
  preserve,
  shortys,
  dunes,
  pacific,
  'old-mac': oldMac,
  sheep,
}

export const allScorecards: Scorecard[] = [
  trails,
  preserve,
  shortys,
  dunes,
  pacific,
  oldMac,
  sheep,
]
