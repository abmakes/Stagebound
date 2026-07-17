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

/** Three finals after the 7 curriculum chapters (Job → Travel → Championship) */
export const FINALS: ChapterDef[] = [
  {
    id: 'final-2-career',
    number: 8,
    title: 'Final 1 · Career Fair',
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
    number: 9,
    title: 'Final 2 · Travel Pitch',
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
    id: 'final-5-championship',
    number: 10,
    title: 'Final 3 · Championship MC Night',
    subtitle: 'Ha Long Bay championship — clear this to lock your Stagebound Score.',
    requires: [...CORE_REQ],
    activeSlots: FULL_SLOTS,
    lesson: {
      headline: 'Championship night',
      body: 'One full MC set. Finish this to lock in your Stagebound Score — it already syncs to the class board after every chapter you clear.',
      examples: [
        { label: 'Everything', detail: 'All unlocked tools count' },
        { label: 'Post score', detail: 'Join once with your name + class code; wins keep updating the board' },
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
