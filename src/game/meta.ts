import type {
  AudienceCure,
  AudienceWho,
  MetaState,
  PackId,
  PlayerAvatar,
  RubricStat,
  RunResult,
  SkillId,
} from '../data/types'
import { ALL_CHAPTERS, CHAPTERS, getChapter, SKILL_LABELS } from '../data/curriculum'
import { isFinalChapter, FINALS } from '../data/finals'
import { PACKS } from '../data'
import { getSkillNode, skillNodeState } from '../data/skillTree'
import { SKILL_CODEX } from '../data/unlockOptions'
import { computeStageboundScore } from './scoreboard'

const STORAGE_KEY = 'stagebound-meta-v3'

export const ENERGY_MAX = 3
export const ENERGY_REFRESH_MS = 8 * 60 * 60 * 1000 // 8 hours

const DEFAULT_STATS: Record<RubricStat, number> = {
  clarity: 1,
  vocalVariety: 1,
  eyeContact: 1,
  gestures: 1,
  interest: 1,
  unintentionalMovement: 1,
  purposefulMovement: 1,
}

const DEFAULT_RANKS: Record<SkillId, number> = {
  emotion: 1,
  tone: 0,
  gesture: 0,
  gesture_more: 0,
  stance: 0,
  stance_more: 0,
  volume: 0,
  pause: 0,
  stress: 0,
}

const DEFAULT_CURE: AudienceCure = { girl: false, oldman: false, woman: false }

/** ch1 → girl, ch2 → oldman, ch3 → woman (whole town) */
export function cureFromCleared(chaptersCleared: string[]): AudienceCure {
  return {
    girl: chaptersCleared.includes('ch1-first-words'),
    oldman: chaptersCleared.includes('ch2-find-voice'),
    woman: chaptersCleared.includes('ch3-hands'),
  }
}

export function townFullyCured(cure: AudienceCure): boolean {
  return cure.girl && cure.oldman && cure.woman
}

export function isAudienceCured(cure: AudienceCure, who: AudienceWho): boolean {
  return !!cure[who]
}

export function defaultMeta(): MetaState {
  return {
    version: 3,
    playerName: '',
    playerAvatar: 'boy',
    playerLevel: 1,
    skillPoints: 1,
    energy: ENERGY_MAX,
    energyRefreshedAt: Date.now(),
    unlockedSkills: ['emotion'],
    skillRanks: { ...DEFAULT_RANKS },
    chapterIndex: 0,
    chaptersCleared: [],
    winsByPack: { environment: 0, job: 0, travel: 0 },
    totalWins: 0,
    unlockedPacks: ['environment'],
    unlockedCodex: ['face_feeling', 'eyes_audience', 'eyes_scan', 'eyes_notes', 'tone_variety', 'word_stress'],
    stats: { ...DEFAULT_STATS },
    bestScore: {},
    bestMaxScore: {},
    lastReflection: null,
    pendingLessonChapterId: CHAPTERS[0].id,
    seenIntro: false,
    choicesCorrect: 0,
    choicesWrong: 0,
    quizCorrect: 0,
    quizTotal: 0,
    stageAttempts: 0,
    stageFails: 0,
    finalsMatchSum: 0,
    finalsMatchCount: 0,
    bestStageboundScore: 0,
    gameComplete: false,
    audienceCure: { ...DEFAULT_CURE },
  }
}

export function markIntroSeen(meta: MetaState): MetaState {
  const m = { ...meta, seenIntro: true }
  saveMeta(m)
  return m
}

export function setPlayerAvatar(meta: MetaState, avatar: PlayerAvatar): MetaState {
  const m = { ...meta, playerAvatar: avatar }
  saveMeta(m)
  return m
}

export function setPlayerName(meta: MetaState, name: string): MetaState {
  const cleaned = name.trim().slice(0, 24)
  const m = { ...meta, playerName: cleaned || 'MC' }
  saveMeta(m)
  return m
}

export function mcDisplayName(meta: MetaState): string {
  const n = meta.playerName?.trim()
  if (!n || n === 'MC' || n === 'Stage Ranger') return 'MC'
  return `MC — ${n}`
}

/** Apply 8-hour energy refill (sets energy to at least ENERGY_MAX). */
export function refreshEnergy(meta: MetaState, now = Date.now()): MetaState {
  const elapsed = now - (meta.energyRefreshedAt || 0)
  if (elapsed < ENERGY_REFRESH_MS) return meta
  const ticks = Math.floor(elapsed / ENERGY_REFRESH_MS)
  if (ticks <= 0) return meta
  const m = structuredClone(meta)
  m.energy = Math.max(m.energy, ENERGY_MAX)
  m.energyRefreshedAt = (meta.energyRefreshedAt || now) + ticks * ENERGY_REFRESH_MS
  m.skillPoints += ticks
  saveMeta(m)
  return m
}

export function msUntilEnergyRefresh(meta: MetaState, now = Date.now()): number {
  const next = (meta.energyRefreshedAt || now) + ENERGY_REFRESH_MS
  return Math.max(0, next - now)
}

export function formatCountdown(ms: number): string {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** Grant advanced tiers for saves that already cleared later stages */
function migrateSkillTiers(m: MetaState): MetaState {
  const skills = new Set(m.unlockedSkills)
  const cleared = m.chaptersCleared || []
  const needsMoreGestures =
    cleared.some((id) =>
      ['ch4-stand-tall', 'ch5-river-master', 'ch6-career-fair', 'ch7-travel-pitch'].includes(id),
    ) ||
    cleared.some((id) => id.startsWith('final-')) ||
    m.gameComplete

  if (skills.has('gesture') && needsMoreGestures && !skills.has('gesture_more')) {
    skills.add('gesture_more')
    m.skillRanks.gesture_more = 1
  }
  if (skills.has('stance') && (needsMoreGestures || skills.has('volume') || skills.has('pause')) && !skills.has('stance_more')) {
    // Optional: only auto-grant stance_more if they already progressed past ch4
    if (cleared.includes('ch4-stand-tall') || needsMoreGestures) {
      skills.add('stance_more')
      m.skillRanks.stance_more = 1
    }
  }
  m.unlockedSkills = [...skills]
  // Sync Codex cards for every owned skill (covers new entries on older saves)
  for (const skill of m.unlockedSkills) {
    for (const id of SKILL_CODEX[skill] || []) {
      if (!m.unlockedCodex.includes(id)) m.unlockedCodex.push(id)
    }
  }
  return m
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('stagebound-meta-v2')
    if (!raw) {
      localStorage.removeItem('stagebound-meta-v1')
      return defaultMeta()
    }
    const parsed = JSON.parse(raw) as MetaState
    let name = parsed.playerName || ''
    if (name === 'Stage Ranger') name = ''
    let m: MetaState = {
      ...defaultMeta(),
      ...parsed,
      version: 3,
      playerName: name,
      playerAvatar: parsed.playerAvatar === 'girl' ? 'girl' : 'boy',
      energy: typeof parsed.energy === 'number' ? parsed.energy : ENERGY_MAX,
      energyRefreshedAt: parsed.energyRefreshedAt || Date.now(),
      stats: { ...DEFAULT_STATS, ...parsed.stats },
      skillRanks: { ...DEFAULT_RANKS, ...parsed.skillRanks },
      unlockedSkills: parsed.unlockedSkills?.length ? parsed.unlockedSkills : ['emotion'],
      choicesCorrect: parsed.choicesCorrect || 0,
      choicesWrong: parsed.choicesWrong || 0,
      quizCorrect: parsed.quizCorrect || 0,
      quizTotal: parsed.quizTotal || 0,
      stageAttempts: parsed.stageAttempts || 0,
      stageFails: parsed.stageFails || 0,
      finalsMatchSum: parsed.finalsMatchSum || 0,
      finalsMatchCount: parsed.finalsMatchCount || 0,
      bestStageboundScore: parsed.bestStageboundScore || 0,
      bestScore: parsed.bestScore || {},
      bestMaxScore: parsed.bestMaxScore || {},
      gameComplete: !!parsed.gameComplete,
      audienceCure: cureFromCleared(parsed.chaptersCleared || []),
    }
    m = migrateSkillTiers(m)
    m.audienceCure = cureFromCleared(m.chaptersCleared)
    m = refreshEnergy(m)
    saveMeta(m)
    return m
  } catch {
    return defaultMeta()
  }
}

export function saveMeta(meta: MetaState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
}

export function currentChapter(meta: MetaState) {
  const list = ALL_CHAPTERS
  const next = list.find((c) => !meta.chaptersCleared.includes(c.id))
  if (next) return next
  return list[Math.min(meta.chapterIndex, list.length - 1)]
}

export function recordQuizResult(meta: MetaState, correct: number, total: number): MetaState {
  const m = structuredClone(meta)
  m.quizCorrect += correct
  m.quizTotal += total
  saveMeta(m)
  return m
}

export function applyRunResult(meta: MetaState, result: RunResult): MetaState {
  const next = structuredClone(meta)
  const ch = getChapter(result.chapterId)
  const key = result.chapterId
  if (result.score > (next.bestScore[key] || 0)) {
    next.bestScore[key] = result.score
    next.bestMaxScore[key] = result.maxScore
  }
  next.lastReflection = { strength: result.strength, tip: result.tip }
  next.skillPoints += result.skillPointsGained
  next.stageAttempts += 1
  next.choicesCorrect += result.matches
  const wrongGuess = Math.max(0, result.maxScore - result.score - (result.misses > 0 ? 0 : 0))
  next.choicesWrong += result.misses + Math.max(0, Math.floor(wrongGuess / 2))

  if (isFinalChapter(result.chapterId) && result.maxScore > 0) {
    next.finalsMatchSum += result.score / result.maxScore
    next.finalsMatchCount += 1
  }

  if (result.won) {
    next.winsByPack[result.packId] = (next.winsByPack[result.packId] || 0) + 1
    next.totalWins += 1
    if (!next.chaptersCleared.includes(ch.id)) {
      next.chaptersCleared.push(ch.id)
      result.newUnlocks.push(`Chapter cleared: ${ch.title}`)
    }
    next.audienceCure = cureFromCleared(next.chaptersCleared)
    if (ch.id === 'ch1-first-words') {
      result.newUnlocks.push('The young girl can cheer — boredom is lifting!')
    }
    if (ch.id === 'ch2-find-voice') {
      result.newUnlocks.push('The old man can cheer again!')
    }
    if (ch.id === 'ch3-hands') {
      result.newUnlocks.push('The whole town is cured of boredom!')
    }
    const idx = ALL_CHAPTERS.findIndex((c) => c.id === ch.id)
    if (idx >= next.chapterIndex) {
      next.chapterIndex = Math.min(idx + 1, ALL_CHAPTERS.length - 1)
      const upcoming = ALL_CHAPTERS[next.chapterIndex]
      if (upcoming && !next.chaptersCleared.includes(upcoming.id)) {
        next.pendingLessonChapterId = upcoming.id
      }
    }
    for (const id of Object.keys(PACKS) as PackId[]) {
      if (PACKS[id].unlockWinsNeeded <= next.winsByPack.environment && !next.unlockedPacks.includes(id)) {
        next.unlockedPacks.push(id)
        result.newUnlocks.push(`Topic pack: ${PACKS[id].title}`)
      }
    }
    const packBoost: Record<PackId, RubricStat[]> = {
      environment: ['vocalVariety', 'gestures', 'purposefulMovement', 'interest'],
      job: ['clarity', 'gestures', 'eyeContact', 'interest'],
      travel: ['clarity', 'vocalVariety', 'unintentionalMovement', 'eyeContact'],
    }
    // +1 per distinct rubric boosted at least once on successful turns
    const fromPlay = [...new Set(result.statsHit)]
    for (const s of fromPlay) {
      next.stats[s] = Math.min(5, (next.stats[s] || 1) + 1)
    }
    for (const s of packBoost[result.packId]) {
      next.stats[s] = Math.min(5, (next.stats[s] || 1) + 1)
    }
    if (result.leveledUp) next.playerLevel += 1

    // Keep a live Stagebound Score so the class board can update after every clear
    const score = computeStageboundScore(next)
    if (score.total > next.bestStageboundScore) next.bestStageboundScore = score.total

    if (result.chapterId === 'final-5-championship') {
      next.gameComplete = true
      result.newUnlocks.push(`Stagebound Score: ${score.total}`)
    }
  } else {
    next.stageFails += 1
    if (ch.pressureSkill && !next.unlockedSkills.includes(ch.pressureSkill)) {
      result.newUnlocks.push(`Hint: unlock ${SKILL_LABELS[ch.pressureSkill]} on the skill tree`)
    }
  }

  saveMeta(next)
  return next
}

export function canPlayChapter(meta: MetaState, chapterId: string): { ok: boolean; reason?: string } {
  const ch = getChapter(chapterId)
  if (isFinalChapter(chapterId)) {
    if (!meta.chaptersCleared.includes('ch7-travel-pitch')) {
      return { ok: false, reason: 'Clear Chapter 7 (Travel Pitch) to unlock Finals.' }
    }
    const idx = FINALS.findIndex((f) => f.id === chapterId)
    if (idx > 0 && !meta.chaptersCleared.includes(FINALS[idx - 1].id)) {
      return { ok: false, reason: `Clear ${FINALS[idx - 1].title} first.` }
    }
  }
  const missing = ch.requires.filter((s) => !meta.unlockedSkills.includes(s))
  if (missing.length) {
    return {
      ok: false,
      reason: `Need skill: ${missing.map((id) => SKILL_LABELS[id]).join(', ')}.`,
    }
  }
  if (meta.energy < 1) {
    return {
      ok: false,
      reason: `No energy left. Get energy (quiz) for +1, or wait ${formatCountdown(msUntilEnergyRefresh(meta))}.`,
    }
  }
  return { ok: true }
}

export function spendEnergy(meta: MetaState): MetaState {
  const m = structuredClone(meta)
  m.energy = Math.max(0, m.energy - 1)
  saveMeta(m)
  return m
}

export function addEnergy(meta: MetaState, amount = 1): MetaState {
  const m = structuredClone(meta)
  m.energy += amount
  saveMeta(m)
  return m
}

/** Spend 2 skill points for +1 energy (finals-friendly). */
export function spendSkillPointsForEnergy(
  meta: MetaState,
): { meta: MetaState; ok: boolean; msg: string } {
  if (meta.energy >= ENERGY_MAX) {
    return { meta, ok: false, msg: 'Energy is already full.' }
  }
  if (meta.skillPoints < 2) {
    return { meta, ok: false, msg: 'Need 2 skill points for 1 energy.' }
  }
  const m = structuredClone(meta)
  m.skillPoints -= 2
  m.energy += 1
  saveMeta(m)
  return { meta: m, ok: true, msg: '+1 energy!' }
}

export function buySkill(meta: MetaState, skill: SkillId): { meta: MetaState; ok: boolean; msg: string } {
  if (meta.unlockedSkills.includes(skill)) {
    return { meta, ok: false, msg: 'You already have this skill.' }
  }
  const state = skillNodeState(skill, meta.unlockedSkills)
  if (state === 'locked') {
    const node = getSkillNode(skill)
    const need = node.requires.filter((r) => !meta.unlockedSkills.includes(r))
    return {
      meta,
      ok: false,
      msg: `Locked. Unlock first: ${need.map((id) => SKILL_LABELS[id]).join(' + ')}.`,
    }
  }
  const node = getSkillNode(skill)
  const cost = node.cost
  if (meta.skillPoints < cost) {
    return { meta, ok: false, msg: `Need ${cost} skill point(s). Clear stages or wait for the 8-hour refresh.` }
  }
  const m = structuredClone(meta)
  m.skillPoints -= cost
  m.unlockedSkills.push(skill)
  m.skillRanks[skill] = 1
  m.playerLevel += 1
  for (const id of SKILL_CODEX[skill] || []) {
    if (!m.unlockedCodex.includes(id)) m.unlockedCodex.push(id)
  }
  saveMeta(m)
  return { meta: m, ok: true, msg: `Unlocked ${SKILL_LABELS[skill]}!` }
}

export function resetMeta(): MetaState {
  const m = defaultMeta()
  saveMeta(m)
  return m
}

export function dismissLesson(meta: MetaState): MetaState {
  const m = { ...meta, pendingLessonChapterId: null }
  saveMeta(m)
  return m
}
