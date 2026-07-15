import type { ChapterDef, DeliveryChoice, DeliverySlot, MetaState, RunResult } from '../data/types'
import { getPack } from '../data'
import { getChapter } from '../data/curriculum'
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
  let audience = 70
  // Pressure: missing recommended skill → bored crowd from the start
  if (ch.pressureSkill && !meta.unlockedSkills.includes(ch.pressureSkill)) {
    audience = 42
  }
  // Rank bonuses
  audience += Math.min(12, meta.unlockedSkills.length * 2)

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
  return { ...state, pickStep: state.pickQueue[idx - 1] }
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
  return {
    ...state,
    score: state.score + feedback.points,
    maxScore: state.maxScore + feedback.maxPoints,
    audience: Math.max(0, Math.min(AUDIENCE_MAX, state.audience + feedback.audienceDelta)),
    matches: state.matches + (feedback.ok ? 1 : 0),
    misses: state.misses + (feedback.ok ? 0 : 1),
    lastFeedback: feedback,
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
  }
  // silence unused
  void meta
  return { ...state, phase: 'finished', result }
}
