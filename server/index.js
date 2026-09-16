import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dataDir = path.join(root, 'data')
const scoresPath = path.join(dataDir, 'scores.json')
const PORT = Number(process.env.PORT) || 3001

/** @typedef {Record<string, Record<string, (number|null)[]>>} RoundScores */

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(scoresPath)) {
    fs.writeFileSync(scoresPath, JSON.stringify({ scores: {}, updatedAt: null }, null, 2))
  }
}

function readStore() {
  ensureStore()
  return JSON.parse(fs.readFileSync(scoresPath, 'utf8'))
}

function writeStore(store) {
  ensureStore()
  const tmp = `${scoresPath}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(store, null, 2))
  fs.renameSync(tmp, scoresPath)
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/scores', (_req, res) => {
  res.json(readStore())
})

app.put('/api/scores', (req, res) => {
  const scores = req.body?.scores
  if (!scores || typeof scores !== 'object') {
    res.status(400).json({ error: 'scores object required' })
    return
  }
  const store = { scores, updatedAt: new Date().toISOString() }
  writeStore(store)
  res.json(store)
})

app.patch('/api/scores/:roundId', (req, res) => {
  const { roundId } = req.params
  const roundScores = req.body?.roundScores
  if (!roundScores || typeof roundScores !== 'object') {
    res.status(400).json({ error: 'roundScores object required' })
    return
  }
  const store = readStore()
  store.scores = store.scores || {}
  store.scores[roundId] = roundScores
  store.updatedAt = new Date().toISOString()
  writeStore(store)
  res.json(store)
})

const dist = path.join(root, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bandon scores API on http://0.0.0.0:${PORT}`)
})
