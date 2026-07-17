export interface BoardEntry {
  nickname: string
  classCode: string
  score: number
  accuracy: number
  finalsAvg: number
  chaptersCleared?: number
  at: number
}

export interface BoardProfile {
  nickname: string
  classCode: string
  joined: boolean
}

export interface BoardLoadResult {
  entries: BoardEntry[]
  source: 'cloud' | 'local'
  configured: boolean
  error?: string
}

const BOARD_KEY = 'stagebound-class-board-v1'
const PROFILE_KEY = 'stagebound-board-profile-v1'
const DEFAULT_CLASS = 'WORLD2'

function normalizeClassCode(raw: string): string {
  return raw.trim().toUpperCase().slice(0, 32) || DEFAULT_CLASS
}

function normalizeNickname(raw: string): string {
  return raw.trim().slice(0, 20)
}

export function loadBoardProfile(): BoardProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { nickname: '', classCode: DEFAULT_CLASS, joined: false }
    const parsed = JSON.parse(raw) as Partial<BoardProfile>
    return {
      nickname: normalizeNickname(String(parsed.nickname || '')),
      classCode: normalizeClassCode(String(parsed.classCode || DEFAULT_CLASS)),
      joined: !!parsed.joined && !!normalizeNickname(String(parsed.nickname || '')),
    }
  } catch {
    return { nickname: '', classCode: DEFAULT_CLASS, joined: false }
  }
}

export function saveBoardProfile(profile: Partial<BoardProfile>): BoardProfile {
  const current = loadBoardProfile()
  const next: BoardProfile = {
    nickname: normalizeNickname(profile.nickname ?? current.nickname),
    classCode: normalizeClassCode(profile.classCode ?? current.classCode),
    joined: profile.joined ?? current.joined,
  }
  if (!next.nickname) next.joined = false
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
  return next
}

function readLocalAll(): BoardEntry[] {
  try {
    const raw = localStorage.getItem(BOARD_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BoardEntry[]
  } catch {
    return []
  }
}

function writeLocalAll(all: BoardEntry[]): void {
  localStorage.setItem(BOARD_KEY, JSON.stringify(all))
}

function filterLocal(classCode: string): BoardEntry[] {
  const code = normalizeClassCode(classCode)
  return readLocalAll()
    .filter((e) => e.classCode.toUpperCase() === code)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}

function upsertLocal(entry: Omit<BoardEntry, 'at'> & { at?: number }): BoardEntry[] {
  const code = normalizeClassCode(entry.classCode)
  const nickname = normalizeNickname(entry.nickname) || 'MC'
  const all = readLocalAll()
  const idx = all.findIndex(
    (e) => e.classCode.toUpperCase() === code && e.nickname.toLowerCase() === nickname.toLowerCase(),
  )
  const row: BoardEntry = {
    nickname,
    classCode: code,
    score: entry.score,
    accuracy: entry.accuracy,
    finalsAvg: entry.finalsAvg,
    chaptersCleared: entry.chaptersCleared,
    at: entry.at ?? Date.now(),
  }
  if (idx >= 0) {
    if (row.score >= all[idx].score) all[idx] = row
  } else {
    all.push(row)
  }
  writeLocalAll(all)
  return filterLocal(code)
}

/** Synchronous local-only read (instant UI / offline). */
export function loadBoard(classCode: string): BoardEntry[] {
  return filterLocal(classCode)
}

/** Fetch shared class board from Vercel API; falls back to this browser. */
export async function loadBoardAsync(classCode: string): Promise<BoardLoadResult> {
  const code = normalizeClassCode(classCode)
  const local = filterLocal(code)

  try {
    const res = await fetch(`/api/leaderboard?classCode=${encodeURIComponent(code)}`)
    const data = (await res.json().catch(() => ({}))) as {
      entries?: BoardEntry[]
      configured?: boolean
      error?: string
    }

    if (res.status === 503 || data.configured === false) {
      return {
        entries: local,
        source: 'local',
        configured: false,
        error: data.error || 'Shared leaderboard not configured yet',
      }
    }

    if (!res.ok) {
      return {
        entries: local,
        source: 'local',
        configured: true,
        error: data.error || 'Could not load shared leaderboard',
      }
    }

    const entries = Array.isArray(data.entries) ? data.entries : []
    return { entries, source: 'cloud', configured: true }
  } catch {
    return {
      entries: local,
      source: 'local',
      configured: false,
      error: 'Offline — showing scores saved on this device',
    }
  }
}

export type PostPayload = Omit<BoardEntry, 'at'>

/** Post/update score to shared board (and keep a local copy). */
export async function postToBoard(entry: PostPayload): Promise<BoardLoadResult> {
  const code = normalizeClassCode(entry.classCode)
  const nickname = normalizeNickname(entry.nickname) || 'MC'
  const payload: PostPayload = {
    nickname,
    classCode: code,
    score: Math.max(0, Math.min(1000, Math.round(entry.score))),
    accuracy: entry.accuracy,
    finalsAvg: entry.finalsAvg,
    chaptersCleared: entry.chaptersCleared,
  }

  const localEntries = upsertLocal(payload)
  saveBoardProfile({ nickname, classCode: code, joined: true })

  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await res.json().catch(() => ({}))) as {
      entries?: BoardEntry[]
      configured?: boolean
      error?: string
    }

    if (res.status === 503 || data.configured === false) {
      return {
        entries: localEntries,
        source: 'local',
        configured: false,
        error: data.error || 'Shared leaderboard not configured yet',
      }
    }

    if (!res.ok) {
      return {
        entries: localEntries,
        source: 'local',
        configured: true,
        error: data.error || 'Could not post to shared leaderboard',
      }
    }

    const entries = Array.isArray(data.entries) ? data.entries : localEntries
    return { entries, source: 'cloud', configured: true }
  } catch {
    return {
      entries: localEntries,
      source: 'local',
      configured: false,
      error: 'Offline — score saved on this device only',
    }
  }
}

/** Push latest Stagebound Score if the student already joined the class board. */
export async function syncScoreIfJoined(input: {
  score: number
  accuracy: number
  finalsAvg: number
  chaptersCleared: number
  fallbackName?: string
}): Promise<BoardLoadResult | null> {
  const profile = loadBoardProfile()
  const nickname = profile.nickname || normalizeNickname(input.fallbackName || '')
  if (!profile.joined || !nickname) return null

  return postToBoard({
    nickname,
    classCode: profile.classCode,
    score: input.score,
    accuracy: input.accuracy,
    finalsAvg: input.finalsAvg,
    chaptersCleared: input.chaptersCleared,
  })
}
