import type { GestureId, MetaState, SkillId, StanceId } from './types'

/** Gestures available after unlocking Hand Gestures */
export const GESTURE_BASIC: GestureId[] = ['open_palms', 'two_hands', 'hand_chest', 'none']

/** Extra gestures after More Gestures */
export const GESTURE_MORE: GestureId[] = ['finger_count', 'hand_chop', 'mime', 'step_forward']

/** Stances after unlocking Stance */
export const STANCE_BASIC: StanceId[] = ['tall_open', 'balanced', 'slouch']

/** Extra stance distractors after More Stance */
export const STANCE_MORE: StanceId[] = ['pockets', 'pacing']

export function unlockedGestures(unlockedSkills: SkillId[]): GestureId[] {
  const list = [...GESTURE_BASIC]
  if (unlockedSkills.includes('gesture_more')) list.push(...GESTURE_MORE)
  return list
}

export function unlockedStances(unlockedSkills: SkillId[]): StanceId[] {
  const list = [...STANCE_BASIC]
  if (unlockedSkills.includes('stance_more')) list.push(...STANCE_MORE)
  return list
}

/** Codex entries granted when buying each skill */
export const SKILL_CODEX: Partial<Record<SkillId, string[]>> = {
  emotion: ['face_feeling'],
  tone: ['tone_variety'],
  gesture: ['open_palms', 'two_hands', 'hand_chest'],
  gesture_more: ['finger_count', 'hand_chop', 'mime', 'step_forward'],
  stance: ['tall_open', 'no_pacing'],
  stance_more: ['step_forward'],
  volume: ['volume'],
  pause: ['pause'],
  stress: ['word_stress'],
}

/** Map skill tree node → codex category / ids for "Study in Codex" */
export function codexIdsForSkill(skill: SkillId): string[] {
  return SKILL_CODEX[skill] || []
}

export function hasSkill(meta: MetaState, skill: SkillId): boolean {
  return meta.unlockedSkills.includes(skill)
}
