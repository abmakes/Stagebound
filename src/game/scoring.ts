import type {
  AudienceMood,
  DeliveryChoice,
  DeliverySlot,
  GestureId,
  RubricStat,
  SentenceOption,
  SkillId,
  StanceId,
  TurnChallenge,
} from '../data/types'
import { EMOTION_BY_TURN } from '../data/emotions'
import {
  EMOTION_LABELS,
  GESTURE_LABELS,
  TONE_LABELS,
  VOLUME_LABELS,
  PAUSE_LABELS,
  EYES_LABELS,
  STANCE_LABELS,
  RUBRIC_LABELS,
} from '../data/codex'
import { isGestureUnlocked, isStanceUnlocked } from '../data/unlockOptions'

export interface TurnScore {
  ok: boolean
  points: number
  maxPoints: number
  audienceDelta: number
  tips: string[]
  strengths: string[]
  statsHit: RubricStat[]
}

function normWord(w: string): string {
  return w.replace(/[.,!?;:…]+$/g, '').toLowerCase()
}

function stressMatches(chosen: string | undefined, good: string[] | undefined): boolean {
  if (!good || good.length === 0) return !chosen
  if (!chosen) return false
  const c = normWord(chosen)
  return good.some((g) => normWord(g) === c)
}

/** Fill emotion from table; default missing stance to balanced (never “nothing”). */
export function expectedFor(turn: TurnChallenge): DeliveryChoice {
  return {
    ...turn.expected,
    emotion: turn.expected.emotion ?? EMOTION_BY_TURN[turn.id],
    stance: turn.expected.stance ?? 'balanced',
  }
}

function labelFor(slot: DeliverySlot, value: string | undefined): string {
  if (!value) return 'a clearer choice'
  switch (slot) {
    case 'emotion':
      return EMOTION_LABELS[value as keyof typeof EMOTION_LABELS] || value
    case 'gesture':
      return GESTURE_LABELS[value as keyof typeof GESTURE_LABELS] || value
    case 'tone':
      return TONE_LABELS[value as keyof typeof TONE_LABELS] || value
    case 'volume':
      return VOLUME_LABELS[value as keyof typeof VOLUME_LABELS] || value
    case 'pause':
      return PAUSE_LABELS[value as keyof typeof PAUSE_LABELS] || value
    case 'eyes':
      return EYES_LABELS[value as keyof typeof EYES_LABELS] || value
    case 'stance':
      return STANCE_LABELS[value as keyof typeof STANCE_LABELS] || value
    default:
      return value
  }
}

function contrastTip(
  moment: string,
  slot: DeliverySlot,
  expectedVal: string | undefined,
  chosenVal: string | undefined,
): string {
  const want = labelFor(slot, expectedVal)
  const got = labelFor(slot, chosenVal)
  const shortMoment = moment.replace(/^Body — |^Opening — |^Closing — /i, '').trim() || moment
  return `For ${shortMoment}, use ${want} — not ${got}.`
}

function lockedUnlockTip(slot: DeliverySlot): string {
  if (slot === 'gesture') {
    return 'This move needs More Gestures. Spend skill points to unlock it, then try the speech again.'
  }
  if (slot === 'stance') {
    return 'This stance needs More Stance. Spend skill points to unlock it, then try the speech again.'
  }
  return 'Spend skill points to unlock this skill, then try the speech again.'
}

function expectedLocked(
  key: DeliverySlot,
  exp: string | undefined,
  unlockedSkills: SkillId[],
): boolean {
  if (!exp) return false
  if (key === 'gesture') return !isGestureUnlocked(exp as GestureId, unlockedSkills)
  if (key === 'stance') return !isStanceUnlocked(exp as StanceId, unlockedSkills)
  return false
}

/** Only score slots the chapter activates AND the player has unlocked (word taps always if in active). */
export function effectiveSlots(
  turn: TurnChallenge,
  activeSlots: DeliverySlot[],
  unlockedSkills: SkillId[],
): DeliverySlot[] {
  const skillForSlot: Partial<Record<DeliverySlot, SkillId>> = {
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
  return activeSlots.filter((slot) => {
    const sk = skillForSlot[slot]
    if (!sk) return true
    if (!unlockedSkills.includes(sk)) return false
    if (turn.slots.includes(slot) || activeSlots.includes(slot)) return true
    return false
  })
}

export function scoreTurn(
  turn: TurnChallenge,
  sentence: SentenceOption,
  delivery: DeliveryChoice,
  activeSlots: DeliverySlot[],
  unlockedSkills: SkillId[],
): TurnScore {
  const tips: string[] = []
  const strengths: string[] = []
  let points = 0
  const slots = effectiveSlots(turn, activeSlots, unlockedSkills)
  const maxPoints = 1 + slots.length
  const expected = expectedFor(turn)

  if (sentence.isCorrect) {
    points += 1
    strengths.push('Clear line for this moment')
  } else {
    tips.push(sentence.tipIfWrong || 'Pick a line that fits this part of the speech.')
  }

  const checkChoice = (key: DeliverySlot, goodMsg: string) => {
    if (!slots.includes(key)) return
    const exp = expected[key] as string | undefined
    const got = delivery[key] as string | undefined
    if (got === exp) {
      points += 1
      strengths.push(goodMsg)
      return
    }
    if (expectedLocked(key, exp, unlockedSkills)) {
      tips.push(lockedUnlockTip(key))
      return
    }
    tips.push(contrastTip(turn.moment, key, exp, got))
  }

  const checkWord = (
    key: 'stressWord' | 'sayClearWord',
    goodMsg: string,
    goodList: string[] | undefined,
    fallback: string | undefined,
  ) => {
    if (!slots.includes(key)) return
    const list = goodList ?? (fallback ? [fallback] : [])
    if (stressMatches(delivery[key], list)) {
      points += 1
      strengths.push(goodMsg)
    } else {
      const want = list[0] || fallback || 'the key word'
      const got = delivery[key] || 'a different word'
      tips.push(`For ${turn.moment}, stress “${want}” — not “${got}”.`)
    }
  }

  checkChoice('emotion', 'Your face matched the feeling')
  checkChoice('gesture', 'Gesture matched the line')
  checkChoice('tone', 'Tone matched the message')
  checkChoice('volume', 'Volume was clear (not a shout)')
  checkChoice('pause', 'Good pause')
  checkChoice('eyes', 'Eyes on the audience')
  checkChoice('stance', 'Strong stance')
  checkWord('stressWord', 'You stressed a key word', sentence.goodStress, expected.stressWord)
  checkWord('sayClearWord', 'You marked a clear word', sentence.clearWords, expected.sayClearWord)

  if (slots.includes('volume') && delivery.volume === 'shout' && expected.volume !== 'shout') {
    tips.push('Shouting is not the same as a strong, clear voice.')
  }

  const ratio = maxPoints ? points / maxPoints : 0
  const ok = ratio >= 0.6 && sentence.isCorrect
  let audienceDelta = 0
  if (ok) audienceDelta = ratio >= 0.85 ? 12 : 8
  else if (sentence.isCorrect) audienceDelta = -6
  else audienceDelta = -10
  if (turn.beat === 'boss' && !ok) audienceDelta -= 4

  return {
    ok,
    points,
    maxPoints,
    audienceDelta,
    tips,
    strengths,
    statsHit: ok ? turn.rubricBoost : [],
  }
}

/**
 * Shared meter → mood bands.
 * Afflicted is the floor when the crowd is still sick with boredom.
 */
export function moodFromAudience(audience: number, lastOk: boolean | null): AudienceMood {
  if (audience >= 88) return 'cheer'
  if (audience >= 70) return 'happy'
  if (audience >= 48) return lastOk === false ? 'confused' : 'engaged'
  if (audience >= 28) return 'bored'
  if (audience >= 12) return lastOk === false ? 'confused' : 'bored'
  return 'afflicted'
}

export function reflectionFromRun(
  strengths: string[],
  tips: string[],
  statsHit: RubricStat[],
): { strength: string; tip: string } {
  const strength =
    strengths[0] ||
    (statsHit[0] ? `Your ${RUBRIC_LABELS[statsHit[0]]} is growing.` : 'You kept speaking on stage.')
  const tip = tips[0] || 'Replay and try a different face or gesture on the same line.'
  return { strength, tip }
}
