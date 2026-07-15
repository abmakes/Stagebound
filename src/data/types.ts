export type PackId = 'environment' | 'job' | 'travel'

export type SkillId =
  | 'emotion'
  | 'tone'
  | 'gesture'
  | 'gesture_more'
  | 'stance'
  | 'stance_more'
  | 'volume'
  | 'pause'
  | 'stress'

export type EmotionId = 'smile' | 'serious' | 'excited' | 'concerned'
export type GestureId =
  | 'two_hands'
  | 'finger_count'
  | 'hand_chest'
  | 'hand_chop'
  | 'mime'
  | 'open_palms'
  | 'step_forward'
  | 'none'
export type ToneId = 'serious' | 'excited' | 'friendly' | 'hopeful'
export type VolumeId = 'soft' | 'clear' | 'strong' | 'shout'
export type PauseId = 'none' | 'after'
export type EyesId = 'notes' | 'audience' | 'scan'
export type StanceId = 'slouch' | 'pockets' | 'tall_open' | 'pacing' | 'balanced'

export type RubricStat =
  | 'clarity'
  | 'vocalVariety'
  | 'eyeContact'
  | 'gestures'
  | 'interest'
  | 'unintentionalMovement'
  | 'purposefulMovement'

export type AudienceMood = 'cheer' | 'happy' | 'engaged' | 'bored' | 'confused' | 'afflicted'

export type AudienceWho = 'oldman' | 'woman' | 'girl'

export interface AudienceCure {
  girl: boolean
  oldman: boolean
  woman: boolean
}

export interface DeliveryChoice {
  emotion?: EmotionId
  gesture?: GestureId
  tone?: ToneId
  volume?: VolumeId
  pause?: PauseId
  eyes?: EyesId
  stance?: StanceId
  stressWord?: string
  sayClearWord?: string
}

export interface SentenceOption {
  id: string
  text: string
  words: string[]
  goodStress?: string[]
  clearWords?: string[]
  isCorrect: boolean
  tipIfWrong?: string
}

export type DeliverySlot = keyof DeliveryChoice

export interface TurnChallenge {
  id: string
  moment: string
  beat: 'opening' | 'body' | 'event' | 'closing' | 'boss' | 'practice'
  prompt: string
  sentences: SentenceOption[]
  expected: DeliveryChoice
  /** All possible slots this turn knows about */
  slots: DeliverySlot[]
  coachTip: string
  successTip: string
  rubricBoost: RubricStat[]
}

export interface TopicPack {
  id: PackId
  title: string
  subtitle: string
  bossName: string
  unlockWinsNeeded: number
  focus: string
  turns: TurnChallenge[]
}

export interface CodexEntry {
  id: string
  name: string
  when: string
  example: string
  category: 'gesture' | 'voice' | 'pace' | 'body' | 'eyes' | 'emotion'
}

export interface ChapterDef {
  id: string
  number: number
  title: string
  subtitle: string
  /** Skill taught / required to attempt */
  teaches?: SkillId
  /** Skills that must already be unlocked to play */
  requires: SkillId[]
  /** Slots active during this chapter's runs */
  activeSlots: DeliverySlot[]
  /** Lesson shown before first attempt (or when skill newly available) */
  lesson: {
    headline: string
    body: string
    examples: { label: string; detail: string }[]
  }
  /** Which pack content to pull turns from */
  packId: PackId
  /** Turn ids from that pack (subset for shorter early chapters) */
  turnIds: string[]
  /** Audience starts more bored if missing recommended skills */
  pressureSkill?: SkillId
  rewardSkillPoints: number
  practiceSkillPoints: number
}

export type PlayerAvatar = 'boy' | 'girl'

export interface MetaState {
  version: number
  playerName: string
  playerAvatar: PlayerAvatar
  playerLevel: number
  skillPoints: number
  /** Speaking attempts. Refills toward ENERGY_MAX every 8 hours. */
  energy: number
  /** Timestamp (ms) of last energy refill tick */
  energyRefreshedAt: number
  unlockedSkills: SkillId[]
  skillRanks: Record<SkillId, number>
  chapterIndex: number
  chaptersCleared: string[]
  winsByPack: Record<PackId, number>
  totalWins: number
  unlockedPacks: PackId[]
  unlockedCodex: string[]
  stats: Record<RubricStat, number>
  bestScore: Record<string, number>
  /** Max points available on the run that set bestScore (for star ratios) */
  bestMaxScore: Record<string, number>
  lastReflection: { strength: string; tip: string } | null
  pendingLessonChapterId: string | null
  /** First-time storyboard intro already shown */
  seenIntro: boolean
  /** Lifetime delivery choice tallies for Stagebound Score */
  choicesCorrect: number
  choicesWrong: number
  quizCorrect: number
  quizTotal: number
  stageAttempts: number
  stageFails: number
  /** Sum of match ratios on finals turns; count of final turns scored */
  finalsMatchSum: number
  finalsMatchCount: number
  bestStageboundScore: number
  gameComplete: boolean
  /** Who has been cured of boredom (cheer unlocked; no longer start afflicted) */
  audienceCure: AudienceCure
}

export interface RunResult {
  won: boolean
  chapterId: string
  packId: PackId
  score: number
  maxScore: number
  matches: number
  misses: number
  audienceLeft: number
  strength: string
  tip: string
  skillPointsGained: number
  leveledUp: boolean
  newUnlocks: string[]
  /** Rubric stats hit on successful turns this run */
  statsHit: RubricStat[]
}
