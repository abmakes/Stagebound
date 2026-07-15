import type { ChapterDef, SkillId } from './types'
import { FINALS } from './finals'

export const SKILL_LABELS: Record<SkillId, string> = {
  emotion: 'Face & Feeling',
  tone: 'Tone of Voice',
  gesture: 'Hand Gestures',
  gesture_more: 'More Gestures',
  stance: 'Stance & Movement',
  stance_more: 'More Stance',
  volume: 'Volume',
  pause: 'The Pause',
  stress: 'Word Stress',
}

export const SKILL_COST: Record<SkillId, number> = {
  emotion: 0,
  tone: 1,
  gesture: 1,
  gesture_more: 1,
  stance: 1,
  stance_more: 1,
  volume: 1,
  pause: 1,
  stress: 1,
}

/** @deprecated linear order — tree uses prerequisites in skillTree.ts */
export const SKILL_ORDER: SkillId[] = [
  'emotion',
  'tone',
  'gesture',
  'gesture_more',
  'stance',
  'stance_more',
  'volume',
  'pause',
  'stress',
]

/** UI units — keep stage ids for saves; group for hub display */
export interface CurriculumUnit {
  id: string
  title: string
  subtitle: string
  chapterIds: string[]
}

export const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    subtitle: 'Face, tone, and three core gestures',
    chapterIds: ['ch1-first-words', 'ch2-find-voice', 'ch3-hands'],
  },
  {
    id: 'full-speeches',
    title: 'Full Speeches',
    subtitle: 'Stance, volume, pause, and longer talks',
    chapterIds: ['ch4-stand-tall', 'ch5-river-master', 'ch6-career-fair', 'ch7-travel-pitch'],
  },
  {
    id: 'finals',
    title: 'Final Speeches',
    subtitle: 'Full delivery exams',
    chapterIds: [
      'final-1-river',
      'final-2-career',
      'final-3-travel',
      'final-4-pressure',
      'final-5-championship',
    ],
  },
]

export function unitForChapter(chapterId: string): CurriculumUnit {
  const u = CURRICULUM_UNITS.find((unit) => unit.chapterIds.includes(chapterId))
  return u || CURRICULUM_UNITS[0]
}

/** Duolingo-style curriculum: learn → practice → level up → next skill */
export const CHAPTERS: ChapterDef[] = [
  {
    id: 'ch1-first-words',
    number: 1,
    title: 'First Words',
    subtitle: 'Say a clear line and show a feeling on your face.',
    teaches: 'emotion',
    requires: ['emotion'],
    activeSlots: ['emotion'],
    lesson: {
      headline: 'Your face is part of the speech',
      body: 'Before gestures or fancy voice tricks, the audience reads your face. Match your face to the words.',
      examples: [
        { label: 'Smile', detail: 'Greetings, thank you, good news' },
        { label: 'Serious', detail: 'Problems and important facts' },
        { label: 'Excited', detail: 'Dreams and happy plans' },
        { label: 'Concerned', detail: 'When you care about harm or danger' },
      ],
    },
    packId: 'environment',
    turnIds: ['env-open', 'env-problem', 'env-feeling'],
    rewardSkillPoints: 1,
    practiceSkillPoints: 1,
  },
  {
    id: 'ch2-find-voice',
    number: 2,
    title: 'Find Your Voice',
    subtitle: 'Add tone — how your voice feels.',
    teaches: 'tone',
    requires: ['emotion', 'tone'],
    activeSlots: ['emotion', 'tone'],
    lesson: {
      headline: 'Tone is the color of your voice',
      body: 'Same words can sound kind, urgent, or flat. Pick a tone that fits the line. The crowd gets bored if every line sounds the same.',
      examples: [
        { label: 'Friendly', detail: 'Openings and thank-you lines' },
        { label: 'Serious', detail: 'Harm, danger, strong facts' },
        { label: 'Excited', detail: 'Dream jobs and cool travel plans' },
        { label: 'Hopeful', detail: 'Actions we can take to help' },
      ],
    },
    packId: 'environment',
    turnIds: ['env-open', 'env-problem', 'env-harm', 'env-actions'],
    pressureSkill: 'tone',
    rewardSkillPoints: 1,
    practiceSkillPoints: 1,
  },
  {
    id: 'ch3-hands',
    number: 3,
    title: 'Hands That Speak',
    subtitle: 'Learn three gestures well before more.',
    teaches: 'gesture',
    requires: ['emotion', 'gesture'],
    activeSlots: ['emotion', 'tone', 'gesture'],
    lesson: {
      headline: 'Master three gestures first',
      body: 'A gesture should match the idea — not random waving. Learn open palms, two hands, and hand on chest before you unlock more.',
      examples: [
        { label: 'Open palms', detail: 'Hello / invite the audience' },
        { label: 'Two hands', detail: 'Two points or cause → effect' },
        { label: 'Hand on chest', detail: 'Feelings and care' },
      ],
    },
    packId: 'environment',
    turnIds: ['env-open', 'env-feeling', 'env-event'],
    pressureSkill: 'gesture',
    rewardSkillPoints: 1,
    practiceSkillPoints: 1,
  },
  {
    id: 'ch4-stand-tall',
    number: 4,
    title: 'Stand Tall',
    subtitle: 'Stance and one purposeful step.',
    teaches: 'stance',
    requires: ['emotion', 'tone', 'gesture', 'gesture_more', 'stance'],
    activeSlots: ['emotion', 'tone', 'gesture', 'stance'],
    lesson: {
      headline: 'Your body tells a story too',
      body: 'Stand tall and open. Do not hide hands in pockets or pace without a reason. Sometimes one step forward makes a strong point land.',
      examples: [
        { label: 'Tall + open', detail: 'Look ready and trustworthy' },
        { label: 'Balanced still', detail: 'Most normal lines' },
        { label: 'One step forward', detail: 'Big call to action' },
        { label: 'Avoid', detail: 'Slouch, pockets, nervous pacing' },
      ],
    },
    packId: 'environment',
    turnIds: ['env-open', 'env-harm', 'env-actions', 'env-close', 'env-boss'],
    pressureSkill: 'stance',
    rewardSkillPoints: 1,
    practiceSkillPoints: 1,
  },
  {
    id: 'ch5-river-master',
    number: 5,
    title: 'Save the River',
    subtitle: 'Full Environment speech — volume & pause unlock help a lot.',
    requires: ['emotion', 'tone', 'gesture', 'gesture_more', 'stance'],
    activeSlots: ['emotion', 'tone', 'gesture', 'stance', 'volume', 'pause', 'stressWord'],
    lesson: {
      headline: 'Boss night on the river stage',
      body: 'You know the basics. Now stack them. If you unlocked Volume, Pause, or Word Stress with skill points, this chapter gets much easier.',
      examples: [
        { label: 'Strong volume', detail: 'Urgency without shouting' },
        { label: 'Pause', detail: 'After a shocking fact' },
        { label: 'Stress a word', detail: 'Tap MUST or the key noun' },
      ],
    },
    packId: 'environment',
    turnIds: [
      'env-open',
      'env-problem',
      'env-harm',
      'env-feeling',
      'env-event',
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
    id: 'ch6-career-fair',
    number: 6,
    title: 'Career Fair',
    subtitle: 'Job unit — clear volume and excited face.',
    requires: ['emotion', 'tone', 'gesture', 'gesture_more', 'stance'],
    activeSlots: ['emotion', 'tone', 'gesture', 'stance', 'volume', 'stressWord'],
    lesson: {
      headline: 'Sell your dream job',
      body: 'Sound clear and excited about your future. Mime your daily tasks. Count skills on your fingers.',
      examples: [
        { label: 'Excited face + tone', detail: 'When you name your dream job' },
        { label: 'Clear volume', detail: 'Back row must hear you — no shout' },
        { label: 'Mime tasks', detail: 'Show the work with your hands' },
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
    id: 'ch7-travel-pitch',
    number: 7,
    title: 'Travel Pitch Night',
    subtitle: 'Pause and clear words win trust.',
    requires: ['emotion', 'tone', 'gesture', 'gesture_more', 'stance'],
    activeSlots: ['emotion', 'tone', 'gesture', 'stance', 'pause', 'stressWord', 'sayClearWord'],
    lesson: {
      headline: 'Calm rhythm = trustworthy guide',
      body: 'Travel pitches fail when you rush. Pause after tips. Say place names clearly.',
      examples: [
        { label: 'Pause', detail: 'After the country name and after tips' },
        { label: 'Say clear', detail: 'Tap Japan, Fuji, Language…' },
        { label: 'Friendly tone', detail: 'Invite — do not shout' },
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
]

/** Curriculum + finals in play order */
export const ALL_CHAPTERS: ChapterDef[] = [...CHAPTERS, ...FINALS]

export function getChapter(id: string): ChapterDef {
  const ch = ALL_CHAPTERS.find((c) => c.id === id)
  if (!ch) throw new Error(`Unknown chapter ${id}`)
  return ch
}

export function nextSkillToBuy(unlocked: SkillId[]): SkillId | null {
  for (const s of SKILL_ORDER) {
    if (!unlocked.includes(s)) return s
  }
  return null
}

export function finalsUnlocked(chaptersCleared: string[]): boolean {
  return chaptersCleared.includes('ch7-travel-pitch')
}
