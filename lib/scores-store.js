import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Redis } from '@upstash/redis'

const KEY = 'bandon:scores'
const empty = () => ({ scores: {}, closestToPin: {}, teamAssignments: null, tees: {}, handicaps: {}, updatedAt: null })

function filePaths() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const dataDir = path.join(root, 'data')
  return { dataDir, scoresPath: path.join(dataDir, 'scores.json') }
}

function hasRedis() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  )
}

function redis() {
  return Redis.fromEnv()
}

function readFileStore() {
  const { dataDir, scoresPath } = filePaths()
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(scoresPath)) {
    fs.writeFileSync(scoresPath, JSON.stringify(empty(), null, 2))
  }
  return JSON.parse(fs.readFileSync(scoresPath, 'utf8'))
}

function writeFileStore(store) {
  const { dataDir, scoresPath } = filePaths()
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const tmp = `${scoresPath}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2))
  fs.renameSync(tmp, scoresPath)
}

export async function readScores() {
  if (hasRedis()) {
    const data = await redis().get(KEY)
    if (!data) return empty()
    return typeof data === 'string' ? JSON.parse(data) : data
  }
  if (process.env.VERCEL) {
    throw new Error(
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for Vercel (Storage → Upstash Redis).',
    )
  }
  return readFileStore()
}

export async function writeScores(store) {
  const next = {
    scores: store.scores ?? {},
    closestToPin: store.closestToPin ?? {},
    teamAssignments: store.teamAssignments ?? null,
    tees: store.tees ?? {},
    handicaps: store.handicaps ?? {},
    updatedAt: new Date().toISOString(),
  }
  if (hasRedis()) {
    await redis().set(KEY, next)
  } else if (process.env.VERCEL) {
    throw new Error(
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for Vercel (Storage → Upstash Redis).',
    )
  } else {
    writeFileStore(next)
  }
  return next
}

export async function patchRound(roundId, roundScores, closestToPin, settings = {}) {
  const store = await readScores()
  store.scores = store.scores || {}
  store.closestToPin = store.closestToPin || {}
  store.tees = store.tees || {}
  store.handicaps = store.handicaps || {}
  if (roundScores !== undefined) store.scores[roundId] = roundScores
  if (closestToPin !== undefined) store.closestToPin[roundId] = closestToPin
  if (settings.teeId !== undefined) store.tees[roundId] = settings.teeId
  if (settings.handicaps !== undefined) store.handicaps[roundId] = settings.handicaps
  return writeScores(store)
}

export async function patchTeamAssignments(teamAssignments) {
  const store = await readScores()
  store.teamAssignments = teamAssignments
  return writeScores(store)
}

export function storageMode() {
  return hasRedis() ? 'upstash' : 'file'
}
