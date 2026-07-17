import { Redis } from '@upstash/redis'

const MAX_ENTRIES = 50
const SCORE_MIN = 0
const SCORE_MAX = 1000

function redisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function boardKey(classCode) {
  return `stagebound:board:${classCode}`
}

function normalizeClassCode(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .slice(0, 32)
}

function normalizeNickname(raw) {
  return String(raw || '')
    .trim()
    .slice(0, 20)
}

function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

async function readEntries(redis, classCode) {
  const raw = await redis.hgetall(boardKey(classCode))
  if (!raw || typeof raw !== 'object') return []

  const entries = []
  for (const value of Object.values(raw)) {
    try {
      const row = typeof value === 'string' ? JSON.parse(value) : value
      if (row && typeof row.nickname === 'string' && typeof row.score === 'number') {
        entries.push(row)
      }
    } catch {
      // skip bad rows
    }
  }

  return entries.sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname)).slice(0, 20)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const redis = redisClient()
  if (!redis) {
    res.status(503).json({
      error: 'Leaderboard database is not configured. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.',
      configured: false,
    })
    return
  }

  try {
    if (req.method === 'GET') {
      const classCode = normalizeClassCode(req.query.classCode) || 'WORLD2'
      if (!classCode) {
        res.status(400).json({ error: 'classCode is required' })
        return
      }
      const entries = await readEntries(redis, classCode)
      res.status(200).json({ configured: true, classCode, entries })
      return
    }

    if (req.method === 'POST') {
      const body = parseBody(req)
      const classCode = normalizeClassCode(body.classCode) || 'WORLD2'
      const nickname = normalizeNickname(body.nickname)
      const score = Math.round(Number(body.score))
      const accuracy = Number(body.accuracy)
      const finalsAvg = Number(body.finalsAvg)
      const chaptersCleared = Math.max(0, Math.min(12, Math.round(Number(body.chaptersCleared) || 0)))

      if (!nickname) {
        res.status(400).json({ error: 'nickname is required' })
        return
      }
      if (!Number.isFinite(score) || score < SCORE_MIN || score > SCORE_MAX) {
        res.status(400).json({ error: `score must be ${SCORE_MIN}-${SCORE_MAX}` })
        return
      }

      const key = boardKey(classCode)
      const field = nickname.toLowerCase()
      const existingRaw = await redis.hget(key, field)
      let existing = null
      if (existingRaw) {
        try {
          existing = typeof existingRaw === 'string' ? JSON.parse(existingRaw) : existingRaw
        } catch {
          existing = null
        }
      }

      if (existing && typeof existing.score === 'number' && existing.score > score) {
        const entries = await readEntries(redis, classCode)
        res.status(200).json({
          configured: true,
          classCode,
          entries,
          updated: false,
          keptBest: true,
        })
        return
      }

      const row = {
        nickname,
        classCode,
        score,
        accuracy: Number.isFinite(accuracy) ? Math.max(0, Math.min(1, accuracy)) : 0,
        finalsAvg: Number.isFinite(finalsAvg) ? Math.max(0, Math.min(1, finalsAvg)) : 0,
        chaptersCleared,
        at: Date.now(),
      }

      await redis.hset(key, { [field]: JSON.stringify(row) })

      // Cap class size so free Redis stays tidy
      const all = await redis.hgetall(key)
      const ranked = Object.entries(all || {})
        .map(([f, value]) => {
          try {
            const parsed = typeof value === 'string' ? JSON.parse(value) : value
            return { field: f, score: parsed?.score ?? 0 }
          } catch {
            return { field: f, score: 0 }
          }
        })
        .sort((a, b) => b.score - a.score)

      if (ranked.length > MAX_ENTRIES) {
        const drop = ranked.slice(MAX_ENTRIES).map((r) => r.field)
        if (drop.length) await redis.hdel(key, ...drop)
      }

      const entries = await readEntries(redis, classCode)
      res.status(200).json({ configured: true, classCode, entries, updated: true })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseBody(req)
      const classCode =
        normalizeClassCode(req.query.classCode || body.classCode) || 'WORLD2'
      const nickname = normalizeNickname(req.query.nickname || body.nickname)

      if (!nickname) {
        res.status(400).json({ error: 'nickname is required' })
        return
      }

      const key = boardKey(classCode)
      const field = nickname.toLowerCase()
      await redis.hdel(key, field)

      const entries = await readEntries(redis, classCode)
      res.status(200).json({ configured: true, classCode, entries, removed: nickname })
      return
    }

    res.setHeader('Allow', 'GET, POST, DELETE')
    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('leaderboard api error', err)
    res.status(500).json({ error: 'Leaderboard request failed' })
  }
}
