export interface BoardEntry {
  nickname: string
  classCode: string
  score: number
  accuracy: number
  finalsAvg: number
  at: number
}

const KEY = 'stagebound-class-board-v1'

export function loadBoard(classCode: string): BoardEntry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const all = JSON.parse(raw) as BoardEntry[]
    const code = classCode.trim().toUpperCase()
    return all
      .filter((e) => e.classCode.toUpperCase() === code)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
  } catch {
    return []
  }
}

export function postToBoard(entry: Omit<BoardEntry, 'at'>): BoardEntry[] {
  const code = entry.classCode.trim().toUpperCase() || 'HALONG-A2'
  const nickname = entry.nickname.trim().slice(0, 20) || 'MC'
  let all: BoardEntry[] = []
  try {
    all = JSON.parse(localStorage.getItem(KEY) || '[]') as BoardEntry[]
  } catch {
    all = []
  }
  // Replace same nickname in same class if lower score; else add
  const idx = all.findIndex(
    (e) => e.classCode.toUpperCase() === code && e.nickname.toLowerCase() === nickname.toLowerCase(),
  )
  const row: BoardEntry = {
    nickname,
    classCode: code,
    score: entry.score,
    accuracy: entry.accuracy,
    finalsAvg: entry.finalsAvg,
    at: Date.now(),
  }
  if (idx >= 0) {
    if (row.score >= all[idx].score) all[idx] = row
  } else {
    all.push(row)
  }
  localStorage.setItem(KEY, JSON.stringify(all))
  return loadBoard(code)
}
