import type {
  CodexEntry,
  EmotionId,
  GestureId,
  ToneId,
  VolumeId,
  PauseId,
  EyesId,
  StanceId,
} from './types'

export const EMOTION_LABELS: Record<EmotionId, string> = {
  smile: 'Smile (friendly)',
  serious: 'Serious face',
  excited: 'Excited face',
  concerned: 'Concerned face',
}

export const GESTURE_LABELS: Record<GestureId, string> = {
  two_hands: 'Two hands (one, then the other)',
  finger_count: 'Count on fingers',
  hand_chest: 'Hand on chest',
  hand_chop: 'Hand chop (strong point)',
  mime: 'Mime the action',
  open_palms: 'Open palms to audience',
  step_forward: 'One step forward',
  none: 'No gesture',
}

export const TONE_LABELS: Record<ToneId, string> = {
  serious: 'Serious tone',
  excited: 'Excited tone',
  friendly: 'Friendly tone',
  hopeful: 'Hopeful tone',
}

export const VOLUME_LABELS: Record<VolumeId, string> = {
  soft: 'Soft voice',
  clear: 'Clear voice',
  strong: 'Strong / urgent',
  shout: 'Shout',
}

export const PAUSE_LABELS: Record<PauseId, string> = {
  none: 'No pause — keep going',
  after: 'Pause after the line',
}

export const EYES_LABELS: Record<EyesId, string> = {
  notes: 'Look at notes',
  audience: 'Look at audience',
  scan: 'Scan the room',
}

export const STANCE_LABELS: Record<StanceId, string> = {
  slouch: 'Slouch',
  pockets: 'Hands in pockets',
  tall_open: 'Tall + open stance',
  pacing: 'Nervous pacing',
  balanced: 'Stand still, balanced',
}

export const CODEX: CodexEntry[] = [
  {
    id: 'face_feeling',
    name: 'Face & feeling',
    when: 'Your face should match the words.',
    example: 'Smile for hello. Concerned for dirty rivers.',
    category: 'emotion',
  },
  {
    id: 'two_hands',
    name: 'Two hands, one then the other',
    when: 'You have two points or a cause and effect.',
    example: 'Plastic hurts animals, and it fills the ocean.',
    category: 'gesture',
  },
  {
    id: 'finger_count',
    name: 'Count on fingers',
    when: 'You list three things.',
    example: 'We can reduce, reuse, and recycle.',
    category: 'gesture',
  },
  {
    id: 'hand_chest',
    name: 'Hand on chest',
    when: 'You share a feeling or care.',
    example: 'I feel sad when rivers are dirty.',
    category: 'gesture',
  },
  {
    id: 'hand_chop',
    name: 'Hand chop',
    when: 'You make a strong “must” point.',
    example: 'We must stop wasting water.',
    category: 'gesture',
  },
  {
    id: 'mime',
    name: 'Mime the action',
    when: 'You describe doing something.',
    example: 'We pick up trash. (mime picking up)',
    category: 'gesture',
  },
  {
    id: 'open_palms',
    name: 'Open palms',
    when: 'You greet or invite the audience.',
    example: 'Good morning, everyone!',
    category: 'gesture',
  },
  {
    id: 'step_forward',
    name: 'One step forward',
    when: 'You make your biggest call to action.',
    example: 'We must protect our river.',
    category: 'gesture',
  },
  {
    id: 'word_stress',
    name: 'Stress the key word',
    when: 'Make the important word stand out.',
    example: 'We MUST stop throwing trash.',
    category: 'voice',
  },
  {
    id: 'tone_variety',
    name: 'Match your tone',
    when: 'Serious for problems, excited for dreams, friendly for greetings.',
    example: 'Pollution is dangerous. (serious)',
    category: 'voice',
  },
  {
    id: 'volume',
    name: 'Clear volume (not shout)',
    when: 'Use a back-of-the-room voice. Shouting hurts your message.',
    example: 'Clear voice for the whole hall.',
    category: 'voice',
  },
  {
    id: 'pause',
    name: 'Pause after a big idea',
    when: 'Give people time to think.',
    example: 'Plastic kills turtles. … (pause)',
    category: 'pace',
  },
  {
    id: 'eyes_audience',
    name: 'Look at the audience',
    when: 'Connect with people — not only your notes.',
    example: 'Scan left, middle, right.',
    category: 'eyes',
  },
  {
    id: 'tall_open',
    name: 'Tall open posture',
    when: 'Look ready and trustworthy.',
    example: 'Feet apart, face the audience, no pockets.',
    category: 'body',
  },
  {
    id: 'no_pacing',
    name: 'No nervous pacing',
    when: 'Move only when the idea needs it.',
    example: 'Stand balanced, or take one clear step.',
    category: 'body',
  },
]

export const RUBRIC_LABELS = {
  clarity: 'Clear Voice',
  vocalVariety: 'Voice Magic',
  eyeContact: 'Audience Link',
  gestures: 'Hand Power',
  interest: 'Story Spark',
  unintentionalMovement: 'Steady Stance',
  purposefulMovement: 'Stage Steps',
} as const
