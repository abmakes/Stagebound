import type { ChapterDef, DeliveryChoice, DeliverySlot, MetaState, RunResult } from '../data/types'
import { getPack } from '../data'
import { getChapter } from '../data/curriculum'
import { townFullyCured } from './meta'
import { moodFromAudience, reflectionFromRun, scoreTurn } from './scoring'

export type RunPhase = 'pick' | 'feedback' | 'finished'
export type PickStep = 'sentence' | DeliverySlot | 'confirm'

export interface RunState {
  chapterId: string
  packId: ChapterDef['packId']
  turnIds: string[]
  turnIndex: number
  audience: number
  score: number
  maxScore: number
  matches: number
  misses: number
  phase: RunPhase
  pickStep: PickStep
  pickQueue: PickStep[]
  draft: { sentenceId: string | null; delivery: DeliveryChoice }
  bubbleText: string
  lastFeedback: ReturnType<typeof scoreTurn> | null
  lastOk: boolean | null
  allStrengths: string[]
  allTips: string[]
  statsHit: RunResult['strength'] extends string ? import('../data/types').RubricStat[] : never
  result: RunResult | null
}

const AUDIENCE_MAX = 100

function buildPickQueue(activeSlots: DeliverySlot[], unlocked: MetaState['unlockedSkills']): PickStep[] {
  const order: DeliverySlot[] = [
    'emotion',
    'tone',
    'gesture',
    'stance',
    'volume',
    'pause',
    'stressWord',
    'sayClearWord',
    'eyes',
  ]
  const steps: PickStep[] = ['sentence']
  for (const slot of order) {
    if (!activeSlots.includes(slot)) continue
    const need: Record<string, string> = {
      emotion: 'emotion',
      tone: 'tone',
      gesture: 'gesture',
      stance: 'stance',
      volume: 'volume',
      pause: 'pause',
      stressWord: 'stress',
      sayClearWord: 'stress',
      eyes: 'emotion',
    }
    const sk = need[slot]
    if (sk && !unlocked.includes(sk as never)) continue
    steps.push(slot)
  }
  steps.push('confirm')
  return steps
}

export function startChapterRun(meta: MetaState, chapterId: string): RunState {
  const ch = getChapter(chapterId)
  // Start afflicted until the whole town is cured; then start at bored band
  let audience = townFullyCured(meta.audienceCure) ? 30 : 8
  if (ch.pressureSkill && !meta.unlockedSkills.includes(ch.pressureSkill)) {
    audience = Math.min(audience, 6)
  }
  // Small bonus for unlocked skills (capped so early runs still look afflicted)
  audience += Math.min(6, meta.unlockedSkills.length)

  const queue = buildPickQueue(ch.activeSlots, meta.unlockedSkills)
  return {
    chapterId,
    packId: ch.packId,
    turnIds: ch.turnIds,
    turnIndex: 0,
    audience: Math.min(AUDIENCE_MAX, audience),
    score: 0,
    maxScore: 0,
    matches: 0,
    misses: 0,
    phase: 'pick',
    pickStep: queue[0],
    pickQueue: queue,
    draft: { sentenceId: null, delivery: {} },
    bubbleText: '…',
    lastFeedback: null,
    lastOk: null,
    allStrengths: [],
    allTips: [],
    statsHit: [],
    result: null,
  }
}

export function currentTurn(state: RunState) {
  const pack = getPack(state.packId)
  const id = state.turnIds[state.turnIndex]
  const turn = pack.turns.find((t) => t.id === id)
  if (!turn) throw new Error(`Missing turn ${id}`)
  return turn
}

export function totalTurns(state: RunState): number {
  return state.turnIds.length
}

export function audienceMood(state: RunState) {
  return moodFromAudience(state.audience, state.lastOk)
}

export function selectSentence(state: RunState, sentenceId: string): RunState {
  const turn = currentTurn(state)
  const sentence = turn.sentences.find((s) => s.id === sentenceId)
  const nextQueue = state.pickQueue
  const idx = nextQueue.indexOf('sentence')
  const nextStep = nextQueue[idx + 1] || 'confirm'
  return {
    ...state,
    draft: {
      sentenceId,
      delivery: { ...state.draft.delivery, stressWord: undefined, sayClearWord: undefined },
    },
    bubbleText: sentence?.text || '…',
    pickStep: nextStep,
  }
}

export function selectDelivery(
  state: RunState,
  slot: DeliverySlot,
  value: string,
): RunState {
  const delivery = { ...state.draft.delivery, [slot]: value } as DeliveryChoice
  const idx = state.pickQueue.indexOf(slot)
  const nextStep = state.pickQueue[idx + 1] || 'confirm'
  return {
    ...state,
    draft: { ...state.draft, delivery },
    pickStep: nextStep,
  }
}

export function goBackStep(state: RunState): RunState {
  const idx = state.pickQueue.indexOf(state.pickStep)
  if (idx <= 0) return state
  const prev = state.pickQueue[idx - 1]
  if (prev === 'sentence') {
    return {
      ...state,
      pickStep: 'sentence',
      draft: { sentenceId: null, delivery: {} },
      bubbleText: '…',
    }
  }
  const delivery = { ...state.draft.delivery }
  if (prev !== 'confirm') {
    delete (delivery as Record<string, unknown>)[prev]
  }
  return {
    ...state,
    pickStep: prev,
    draft: { ...state.draft, delivery },
  }
}

/** Undo last scored beat so the player can change answers on this line. */
export function retryCurrentTurn(state: RunState, meta: MetaState): RunState {
  if (state.phase !== 'feedback' || !state.lastFeedback) return state
  const fb = state.lastFeedback
  const ch = getChapter(state.chapterId)
  const queue = buildPickQueue(ch.activeSlots, meta.unlockedSkills)
  return {
    ...state,
    score: Math.max(0, state.score - fb.points),
    maxScore: Math.max(0, state.maxScore - fb.maxPoints),
    audience: Math.max(0, Math.min(AUDIENCE_MAX, state.audience - fb.audienceDelta)),
    matches: Math.max(0, state.matches - (fb.ok ? 1 : 0)),
    misses: Math.max(0, state.misses - (fb.ok ? 0 : 1)),
    allStrengths: state.allStrengths.slice(0, Math.max(0, state.allStrengths.length - fb.strengths.length)),
    allTips: state.allTips.slice(0, Math.max(0, state.allTips.length - fb.tips.length)),
    statsHit: state.statsHit.slice(0, Math.max(0, state.statsHit.length - fb.statsHit.length)),
    lastFeedback: null,
    lastOk: null,
    phase: 'pick',
    pickStep: queue[0],
    pickQueue: queue,
    draft: { sentenceId: null, delivery: {} },
    bubbleText: '…',
  }
}

export function submitCurrent(state: RunState, meta: MetaState): RunState {
  const ch = getChapter(state.chapterId)
  const turn = currentTurn(state)
  const sentence =
    turn.sentences.find((s) => s.id === state.draft.sentenceId) || turn.sentences[0]
  const feedback = scoreTurn(
    turn,
    sentence,
    state.draft.delivery,
    ch.activeSlots,
    meta.unlockedSkills,
  )

  // Scale crowd gains so a strong run can climb from afflicted → cheer within this speech.
  const turnsLeft = Math.max(1, state.turnIds.length - state.turnIndex)
  const cheerTarget = 92
  let audienceDelta = feedback.audienceDelta
  if (feedback.ok) {
    const need = Math.max(0, cheerTarget - state.audience)
    const paced = Math.ceil(need / turnsLeft)
    const ratio = feedback.maxPoints ? feedback.points / feedback.maxPoints : 0
    if (ratio >= 0.85) {
      audienceDelta = Math.max(audienceDelta, paced + 2)
    } else {
      audienceDelta = Math.max(audienceDelta, Math.max(10, Math.floor(paced * 0.7)))
    }
  }

  return {
    ...state,
    score: state.score + feedback.points,
    maxScore: state.maxScore + feedback.maxPoints,
    audience: Math.max(0, Math.min(AUDIENCE_MAX, state.audience + audienceDelta)),
    matches: state.matches + (feedback.ok ? 1 : 0),
    misses: state.misses + (feedback.ok ? 0 : 1),
    lastFeedback: { ...feedback, audienceDelta },
    lastOk: feedback.ok,
    phase: 'feedback',
    allStrengths: [...state.allStrengths, ...feedback.strengths],
    allTips: [...state.allTips, ...feedback.tips],
    statsHit: [...state.statsHit, ...feedback.statsHit],
  }
}

export function advanceAfterFeedback(state: RunState, meta: MetaState): RunState {
  if (state.audience <= 0) return finishRun(state, meta, false)
  const nextIndex = state.turnIndex + 1
  if (nextIndex >= state.turnIds.length) return finishRun(state, meta, true)

  const ch = getChapter(state.chapterId)
  const queue = buildPickQueue(ch.activeSlots, meta.unlockedSkills)
  return {
    ...state,
    turnIndex: nextIndex,
    phase: 'pick',
    pickStep: queue[0],
    pickQueue: queue,
    draft: { sentenceId: null, delivery: {} },
    bubbleText: '…',
    lastFeedback: null,
  }
}

function finishRun(state: RunState, meta: MetaState, won: boolean): RunState {
  const ch = getChapter(state.chapterId)
  const { strength, tip } = reflectionFromRun(state.allStrengths, state.allTips, state.statsHit)
  const reallyWon = won && state.audience > 0
  const skillPointsGained = reallyWon ? ch.rewardSkillPoints : ch.practiceSkillPoints
  const result: RunResult = {
    won: reallyWon,
    chapterId: state.chapterId,
    packId: state.packId,
    score: state.score,
    maxScore: state.maxScore,
    matches: state.matches,
    misses: state.misses,
    audienceLeft: state.audience,
    strength: reallyWon ? strength : strength || 'You learned something from the miss.',
    tip: reallyWon ? tip : tip || 'Spend a skill point, then retry this chapter.',
    skillPointsGained,
    leveledUp: reallyWon,
    newUnlocks: [],
    statsHit: state.statsHit,
  }
  // silence unused
  void meta
  return { ...state, phase: 'finished', result }
}
