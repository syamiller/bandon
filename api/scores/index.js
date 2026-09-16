import { patchRound, readScores, storageMode, writeScores } from '../lib/scores-store.js'

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const store = await readScores()
      send(res, 200, { ...store, storage: storageMode() })
      return
    }

    if (req.method === 'PUT') {
      const body = await readBody(req)
      if (!body?.scores || typeof body.scores !== 'object') {
        send(res, 400, { error: 'scores object required' })
        return
      }
      const store = await writeScores({ scores: body.scores })
      send(res, 200, { ...store, storage: storageMode() })
      return
    }

    send(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    console.error(err)
    send(res, 500, { error: err?.message || 'Server error' })
  }
}
