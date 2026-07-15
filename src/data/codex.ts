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
    when: 'Your face should match the feeling in your words so people trust you.',
    example: 'Smile for hello. Use a concerned face for dirty rivers.',
    category: 'emotion',
  },
  {
    id: 'eyes_audience',
    name: 'Look at the audience',
    when: 'Connect with people in the room — not only your notes on stage.',
    example: 'Scan left, middle, and right while you speak.',
    category: 'eyes',
  },
  {
    id: 'two_hands',
    name: 'Two hands, one then the other',
    when: 'Use this when you have two clear points or a cause and effect.',
    example: 'Plastic hurts animals, and it fills the ocean.',
    category: 'gesture',
  },
  {
    id: 'finger_count',
    name: 'Count on fingers',
    when: 'Count on your fingers when you list three clear actions or ideas.',
    example: 'We can reduce, reuse, and recycle.',
    category: 'gesture',
  },
  {
    id: 'hand_chest',
    name: 'Hand on chest',
    when: 'Put a hand on your chest when you share a real feeling or care.',
    example: 'I feel sad when rivers are dirty.',
    category: 'gesture',
  },
  {
    id: 'hand_chop',
    name: 'Hand chop',
    when: 'Use a firm hand chop when you make a strong “must” point.',
    example: 'We must stop wasting water.',
    category: 'gesture',
  },
  {
    id: 'mime',
    name: 'Mime the action',
    when: 'Mime with your hands when you describe doing a clear action.',
    example: 'We pick up trash. (mime picking up)',
    category: 'gesture',
  },
  {
    id: 'open_palms',
    name: 'Open palms',
    when: 'Open your palms when you greet people or invite the audience in.',
    example: 'Good morning, everyone!',
    category: 'gesture',
  },
  {
    id: 'step_forward',
    name: 'One step forward',
    when: 'Take one step forward for your biggest call to action.',
    example: 'We must protect our river.',
    category: 'gesture',
  },
  {
    id: 'word_stress',
    name: 'Stress the key word',
    when: 'Make the most important word stand out so listeners catch your point.',
    example: 'We MUST stop throwing trash.',
    category: 'voice',
  },
  {
    id: 'tone_variety',
    name: 'Match your tone',
    when: 'Match tone to meaning: friendly greetings, serious problems, excited dreams, hopeful endings.',
    example: 'Pollution is dangerous. (serious) Good morning! (friendly)',
    category: 'voice',
  },
  {
    id: 'volume',
    name: 'Clear volume (not shout)',
    when: 'Use a clear back-of-the-room voice. Shouting strains you and hurts the message.',
    example: 'Speak clearly so the whole hall can hear you.',
    category: 'voice',
  },
  {
    id: 'pause',
    name: 'Pause after a big idea',
    when: 'Pause after a big idea so people have time to think and feel it.',
    example: 'Plastic kills turtles. … (pause)',
    category: 'pace',
  },
  {
    id: 'tall_open',
    name: 'Tall open posture',
    when: 'Stand tall and open when you want to look ready and trustworthy.',
    example: 'Feet apart, face the audience, hands free — no pockets.',
    category: 'body',
  },
  {
    id: 'balanced',
    name: 'Stand still, balanced',
    when: 'Stay still and balanced for most lines so your words carry the focus.',
    example: 'Plant your feet, relax your shoulders, and speak.',
    category: 'body',
  },
  {
    id: 'no_pacing',
    name: 'No nervous pacing',
    when: 'Avoid nervous pacing; move only when the idea truly needs a step.',
    example: 'Stand balanced, or take one clear step forward.',
    category: 'body',
  },
  {
    id: 'avoid_slouch',
    name: 'Avoid the slouch',
    when: 'A slouch makes you look unsure. Lift your chest when the point matters.',
    example: 'Stand tall instead of curling your shoulders in.',
    category: 'body',
  },
  {
    id: 'avoid_pockets',
    name: 'Avoid hands in pockets',
    when: 'Hands in pockets hide your energy. Keep them free for clear gestures.',
    example: 'Open palms or a calm rest at your sides look stronger.',
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
