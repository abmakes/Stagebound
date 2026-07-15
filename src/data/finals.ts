import type { ChapterDef, DeliverySlot } from './types'

const FULL_SLOTS: DeliverySlot[] = [
  'emotion',
  'tone',
  'gesture',
  'stance',
  'volume',
  'pause',
  'stressWord',
  'eyes',
]

const CORE_REQ = ['emotion', 'tone', 'gesture', 'gesture_more', 'stance'] as const

/** Five big-speech finals after the 7 curriculum chapters */
export const FINALS: ChapterDef[] = [
  {
    id: 'final-1-river',
    number: 8,
    title: 'Final 1 · Save the River',
    subtitle: 'Full delivery — every tool you have unlocked.',
    requires: [...CORE_REQ],
    activeSlots: FULL_SLOTS,
    lesson: {
      headline: 'Final exam: Environment',
      body: 'Use face, tone, gesture, stance, volume, pause, and word stress together. Match each line carefully.',
      examples: [
        { label: 'Long form', detail: 'More delivery choices per line' },
        { label: 'Audience', detail: 'Mistakes drain the crowd faster' },
      ],
    },
    packId: 'environment',
    turnIds: [
      'env-open',
      'env-problem',
      'env-harm',
      'env-feeling',
      'env-actions',
      'env-mime',
      'env-close',
      'env-boss',
    ],
    pressureSkill: 'volume',
    rewardSkillPoints: 2,
    practiceSkillPoints: 1,
  },
  {
    id: 'final-2-career',
    number: 9,
    title: 'Final 2 · Career Fair',
    subtitle: 'Sell your dream job with full MC delivery.',
    requires: [...CORE_REQ],
    activeSlots: ['emotion', 'tone', 'gesture', 'stance', 'volume', 'stressWord', 'eyes'],
    lesson: {
      headline: 'Final exam: Job',
      body: 'Excited face for dreams, clear volume, mime tasks, count skills on fingers.',
      examples: [
        { label: 'Clear voice', detail: 'Not a shout' },
        { label: 'Mime', detail: 'Show the daily work' },
      ],
    },
    packId: 'job',
    turnIds: [
      'job-open',
      'job-dream',
      'job-tasks',
      'job-skills',
      'job-event',
      'job-study',
      'job-close',
      'job-boss',
    ],
    pressureSkill: 'volume',
    rewardSkillPoints: 2,
    practiceSkillPoints: 1,
  },
  {
    id: 'final-3-travel',
    number: 10,
    title: 'Final 3 · Travel Pitch',
    subtitle: 'Calm pauses and clear place names.',
    requires: [...CORE_REQ],
    activeSlots: [
      'emotion',
      'tone',
      'gesture',
      'stance',
      'pause',
      'stressWord',
      'sayClearWord',
      'eyes',
    ],
    lesson: {
      headline: 'Final exam: Travel',
      body: 'Pause after tips. Say Japan, Fuji, Language clearly. Friendly trustworthy tone.',
      examples: [
        { label: 'Pause', detail: 'After country name and tips' },
        { label: 'Say clear', detail: 'Tap the hard word' },
      ],
    },
    packId: 'travel',
    turnIds: [
      'tr-open',
      'tr-country',
      'tr-sights',
      'tr-event',
      'tr-tips',
      'tr-feeling',
      'tr-close',
      'tr-boss',
    ],
    pressureSkill: 'pause',
    rewardSkillPoints: 2,
    practiceSkillPoints: 1,
  },
  {
    id: 'final-4-pressure',
    number: 11,
    title: 'Final 4 · Tough Crowd',
    subtitle: 'Harder Environment run — stay accurate under pressure.',
    requires: [...CORE_REQ],
    activeSlots: FULL_SLOTS,
    lesson: {
      headline: 'Stricter scoring night',
      body: 'Same river topic, but the crowd is picky. Aim for strong matches on every line.',
      examples: [
        { label: 'Accuracy', detail: 'Wrong gesture costs more attention' },
        { label: 'Stack skills', detail: 'Use pause + stress + tone together' },
      ],
    },
    packId: 'environment',
    turnIds: [
      'env-open',
      'env-harm',
      'env-event',
      'env-feeling',
      'env-actions',
      'env-mime',
      'env-close',
      'env-boss',
    ],
    pressureSkill: 'pause',
    rewardSkillPoints: 2,
    practiceSkillPoints: 1,
  },
  {
    id: 'final-5-championship',
    number: 12,
    title: 'Final 5 · Championship MC Night',
    subtitle: 'Ha Long Bay championship — clear this to post your score.',
    requires: [...CORE_REQ],
    activeSlots: FULL_SLOTS,
    lesson: {
      headline: 'Championship night',
      body: 'One full MC set. Finish this to unlock your Stagebound Score and the class leaderboard.',
      examples: [
        { label: 'Everything', detail: 'All unlocked tools count' },
        { label: 'Post score', detail: 'Type your name after you win' },
      ],
    },
    packId: 'job',
    turnIds: [
      'job-open',
      'job-dream',
      'job-tasks',
      'job-skills',
      'job-event',
      'job-study',
      'job-close',
      'job-boss',
    ],
    pressureSkill: 'volume',
    rewardSkillPoints: 3,
    practiceSkillPoints: 1,
  },
]

export function isFinalChapter(id: string): boolean {
  return id.startsWith('final-')
}

export function allPlayableChapters() {
  // Lazy import avoid cycle — curriculum exports CHAPTERS
  return null
}
