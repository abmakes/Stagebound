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
      body: 'Shorter remix: name your dream, share why, list skills, promise, then pick a climax style.',
      examples: [
        { label: 'Clear voice', detail: 'Not a shout' },
        { label: 'Eyes up', detail: 'Promise and invite look at the room' },
      ],
    },
    packId: 'job',
    turnIds: [
      'job-open',
      'job-dream',
      'job-final-story',
      'job-skills',
      'job-final-promise',
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
      body: 'Remix: open, describe the country, pause on a place name, share feeling, invite, then climax style.',
      examples: [
        { label: 'Pause', detail: 'After country name and tips' },
        { label: 'Say clear', detail: 'Tap the hard word' },
      ],
    },
    packId: 'travel',
    turnIds: [
      'tr-open',
      'tr-country',
      'tr-final-pause',
      'tr-feeling',
      'tr-final-invite',
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
      headline: 'Ha Long championship night',
      body: 'Welcome the crowd, wake bored faces, link river care to the bay, share hope, then finish with your speaking style.',
      examples: [
        { label: 'Pause', detail: 'After Ha Long and hard facts' },
        { label: 'Style climax', detail: 'Comedy, heart, or fire — match delivery' },
      ],
    },
    packId: 'environment',
    turnIds: ['hl-open', 'hl-crowd', 'hl-river', 'hl-hope', 'hl-style'],
    pressureSkill: 'pause',
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
