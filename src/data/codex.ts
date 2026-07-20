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
    whenVi:
      'Nét mặt của bạn cần khớp với cảm xúc trong lời nói để mọi người tin bạn.',
    example: 'Smile for hello. Use a concerned face for dirty rivers.',
    category: 'emotion',
  },
  {
    id: 'eyes_audience',
    name: 'Look at the audience',
    when: 'Connect with people in the room — not only your notes on stage.',
    whenVi: 'Hãy kết nối với mọi người trong phòng — đừng chỉ nhìn giấy ghi chú trên sân khấu.',
    example: 'Look up and meet eyes while you greet or make a point.',
    category: 'eyes',
  },
  {
    id: 'eyes_scan',
    name: 'Scan the room',
    when: 'Scan left, middle, and right when you want the whole crowd to feel included.',
    whenVi:
      'Nhìn lần lượt bên trái, giữa và bên phải khi bạn muốn cả khán phòng đều cảm thấy được chú ý.',
    example: 'On a big finish, slowly look across the audience.',
    category: 'eyes',
  },
  {
    id: 'eyes_notes',
    name: 'Avoid only looking at notes',
    when: 'Notes can help you, but staring only at paper makes people feel ignored.',
    whenVi:
      'Giấy ghi chú có thể giúp bạn, nhưng chỉ nhìn vào giấy sẽ khiến mọi người cảm thấy bị bỏ quên.',
    example: 'Glance at notes, then look back at the audience.',
    category: 'eyes',
  },
  {
    id: 'two_hands',
    name: 'Two hands, one then the other',
    when: 'Use this when you have two clear points or a cause and effect.',
    whenVi: 'Dùng động tác này khi bạn có hai ý rõ ràng, hoặc một nguyên nhân và một kết quả.',
    example: 'Plastic hurts animals, and it fills the ocean.',
    category: 'gesture',
  },
  {
    id: 'finger_count',
    name: 'Count on fingers',
    when: 'Count on your fingers when you list three clear actions or ideas.',
    whenVi: 'Đếm trên ngón tay khi bạn liệt kê ba hành động hoặc ý tưởng rõ ràng.',
    example: 'We can reduce, reuse, and recycle.',
    category: 'gesture',
  },
  {
    id: 'hand_chest',
    name: 'Hand on chest',
    when: 'Put a hand on your chest when you share a real feeling or care.',
    whenVi: 'Đặt một tay lên ngực khi bạn chia sẻ cảm xúc thật hoặc sự quan tâm.',
    example: 'I feel sad when rivers are dirty.',
    category: 'gesture',
  },
  {
    id: 'hand_chop',
    name: 'Hand chop',
    when: 'Use a firm hand chop when you make a strong “must” point.',
    whenVi: 'Dùng động tác chặt tay chắc chắn khi bạn nhấn mạnh một ý “phải làm”.',
    example: 'We must stop wasting water.',
    category: 'gesture',
  },
  {
    id: 'mime',
    name: 'Mime the action',
    when: 'Mime with your hands when you describe doing a clear action.',
    whenVi: 'Diễn tả bằng tay khi bạn mô tả một hành động rõ ràng.',
    example: 'We pick up trash. (mime picking up)',
    category: 'gesture',
  },
  {
    id: 'open_palms',
    name: 'Open palms',
    when: 'Open your palms when you greet people or invite the audience in.',
    whenVi: 'Mở lòng bàn tay khi bạn chào mọi người hoặc mời khán giả cùng tham gia.',
    example: 'Good morning, everyone!',
    category: 'gesture',
  },
  {
    id: 'step_forward',
    name: 'One step forward',
    when: 'Take one step forward for your biggest call to action.',
    whenVi: 'Bước một bước về phía trước khi bạn đưa ra lời kêu gọi hành động quan trọng nhất.',
    example: 'We must protect our river.',
    category: 'gesture',
  },
  {
    id: 'word_stress',
    name: 'Stress the key word',
    when: 'Make the most important word stand out so listeners catch your point.',
    whenVi: 'Nhấn mạnh từ quan trọng nhất để người nghe nắm được ý của bạn.',
    example: 'We MUST stop throwing trash.',
    category: 'voice',
  },
  {
    id: 'tone_variety',
    name: 'Match your tone',
    when: 'Match tone to meaning: friendly greetings, serious problems, excited dreams, hopeful endings.',
    whenVi:
      'Khớp giọng nói với nội dung: chào thân thiện, vấn đề nghiêm túc, ước mơ hào hứng, kết thúc đầy hy vọng.',
    example: 'Pollution is dangerous. (serious) Good morning! (friendly)',
    category: 'voice',
  },
  {
    id: 'volume',
    name: 'Clear volume (not shout)',
    when: 'Use a clear back-of-the-room voice. Shouting strains you and hurts the message.',
    whenVi:
      'Dùng giọng rõ để người phía sau cũng nghe được. La hét làm bạn mệt và làm yếu thông điệp.',
    example: 'Speak clearly so the whole hall can hear you.',
    category: 'voice',
  },
  {
    id: 'pause',
    name: 'Pause after a big idea',
    when: 'Pause after a big idea so people have time to think and feel it.',
    whenVi: 'Tạm dừng sau một ý lớn để mọi người có thời gian nghĩ và cảm nhận.',
    example: 'Plastic kills turtles. … (pause)',
    category: 'pace',
  },
  {
    id: 'tall_open',
    name: 'Tall open posture',
    when: 'Stand tall and open when you want to look ready and trustworthy.',
    whenVi: 'Đứng thẳng và mở khi bạn muốn trông sẵn sàng và đáng tin.',
    example: 'Feet apart, face the audience, hands free — no pockets.',
    category: 'body',
  },
  {
    id: 'balanced',
    name: 'Stand still, balanced',
    when: 'Stay still and balanced for most lines so your words carry the focus.',
    whenVi: 'Đứng yên và cân bằng ở hầu hết các câu để lời nói của bạn được chú ý.',
    example: 'Plant your feet, relax your shoulders, and speak.',
    category: 'body',
  },
  {
    id: 'no_pacing',
    name: 'No nervous pacing',
    when: 'Avoid nervous pacing; move only when the idea truly needs a step.',
    whenVi: 'Tránh đi đi lại vì hồi hộp; chỉ bước khi ý tưởng thật sự cần một bước.',
    example: 'Stand balanced, or take one clear step forward.',
    category: 'body',
  },
  {
    id: 'avoid_slouch',
    name: 'Avoid the slouch',
    when: 'A slouch makes you look unsure. Lift your chest when the point matters.',
    whenVi: 'Gù lưng khiến bạn trông thiếu tự tin. Ngẩng ngực khi ý bạn quan trọng.',
    example: 'Stand tall instead of curling your shoulders in.',
    category: 'body',
  },
  {
    id: 'avoid_pockets',
    name: 'Avoid hands in pockets',
    when: 'Hands in pockets hide your energy. Keep them free for clear gestures.',
    whenVi: 'Tay trong túi che năng lượng của bạn. Hãy để tay tự do cho các cử chỉ rõ ràng.',
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
