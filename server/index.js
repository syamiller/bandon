import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  patchRound,
  patchTeamAssignments,
  readScores,
  storageMode,
  writeScores,
} from '../lib/scores-store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT) || 3001

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, storage: storageMode() })
})

app.get('/api/scores', async (_req, res) => {
  try {
    const store = await readScores()
    res.json({ ...store, storage: storageMode() })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

app.put('/api/scores', async (req, res) => {
  try {
    if (!req.body?.scores || typeof req.body.scores !== 'object') {
      res.status(400).json({ error: 'scores object required' })
      return
    }
    const current = await readScores()
    const store = await writeScores({ ...current, scores: req.body.scores })
    res.json({ ...store, storage: storageMode() })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

app.patch('/api/scores', async (req, res) => {
  try {
    if (!req.body?.teamAssignments || typeof req.body.teamAssignments !== 'object') {
      res.status(400).json({ error: 'teamAssignments object required' })
      return
    }
    const store = await patchTeamAssignments(req.body.teamAssignments)
    res.json({ ...store, storage: storageMode() })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

app.patch('/api/scores/:roundId', async (req, res) => {
  try {
    const hasScores = req.body?.roundScores && typeof req.body.roundScores === 'object'
    const hasCtp = Array.isArray(req.body?.closestToPin)
    if (!hasScores && !hasCtp) {
      res.status(400).json({ error: 'roundScores or closestToPin required' })
      return
    }
    const store = await patchRound(req.params.roundId, req.body.roundScores, req.body.closestToPin)
    res.json({ ...store, storage: storageMode() })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Server error' })
  }
})

const dist = path.join(root, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Bandon scores API on http://0.0.0.0:${PORT} (${storageMode()})`)
})
