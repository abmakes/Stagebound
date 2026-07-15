import type { SkillId } from './types'
import { SKILL_LABELS } from './curriculum'

export interface SkillNodeDef {
  id: SkillId
  /** Prerequisites — all must be unlocked */
  requires: SkillId[]
  cost: number
  /** Position in tree canvas (percent) */
  x: number
  y: number
  blurb: string
}

/**
 * Branching MC skill tree:
 *   Face → Tone OR Gesture
 *   Gesture → More Gestures (drip-feed)
 *   Stance needs Tone + Gesture; Stance → More Stance
 *   Volume / Pause / Stress fan out from Stance
 */
export const SKILL_NODES: SkillNodeDef[] = [
  {
    id: 'emotion',
    requires: [],
    cost: 0,
    x: 50,
    y: 5,
    blurb: 'Match your face to the words.',
  },
  {
    id: 'tone',
    requires: ['emotion'],
    cost: 1,
    x: 22,
    y: 22,
    blurb: 'Serious, friendly, excited, hopeful.',
  },
  {
    id: 'gesture',
    requires: ['emotion'],
    cost: 1,
    x: 78,
    y: 22,
    blurb: 'Start with three: open palms, two hands, hand on chest.',
  },
  {
    id: 'gesture_more',
    requires: ['gesture'],
    cost: 1,
    x: 88,
    y: 40,
    blurb: 'Count, chop, mime, and one step forward.',
  },
  {
    id: 'stance',
    requires: ['tone', 'gesture'],
    cost: 1,
    x: 50,
    y: 42,
    blurb: 'Stand tall and balanced. Avoid the slouch.',
  },
  {
    id: 'stance_more',
    requires: ['stance'],
    cost: 1,
    x: 50,
    y: 58,
    blurb: 'Spot bad habits: pockets and nervous pacing.',
  },
  {
    id: 'volume',
    requires: ['stance'],
    cost: 1,
    x: 18,
    y: 72,
    blurb: 'Clear voice — not a shout.',
  },
  {
    id: 'pause',
    requires: ['stance'],
    cost: 1,
    x: 50,
    y: 78,
    blurb: 'Let big ideas land.',
  },
  {
    id: 'stress',
    requires: ['stance'],
    cost: 1,
    x: 82,
    y: 72,
    blurb: 'Make the key word stand out.',
  },
]

export const SKILL_EDGES: Array<{ from: SkillId; to: SkillId }> = [
  { from: 'emotion', to: 'tone' },
  { from: 'emotion', to: 'gesture' },
  { from: 'gesture', to: 'gesture_more' },
  { from: 'tone', to: 'stance' },
  { from: 'gesture', to: 'stance' },
  { from: 'stance', to: 'stance_more' },
  { from: 'stance', to: 'volume' },
  { from: 'stance', to: 'pause' },
  { from: 'stance', to: 'stress' },
]

export function getSkillNode(id: SkillId): SkillNodeDef {
  const n = SKILL_NODES.find((s) => s.id === id)
  if (!n) throw new Error(`Unknown skill ${id}`)
  return n
}

export type NodeState = 'owned' | 'available' | 'locked'

export function skillNodeState(id: SkillId, unlocked: SkillId[]): NodeState {
  if (unlocked.includes(id)) return 'owned'
  const node = getSkillNode(id)
  if (node.requires.every((r) => unlocked.includes(r))) return 'available'
  return 'locked'
}

export function shortSkillLabel(id: SkillId): string {
  return SKILL_LABELS[id]
}
