export type CutsceneId = 'intro' | 'thaw' | 'ending'

export type KenBurnsMotion = 'ken-zoom-in' | 'ken-pan-left' | 'ken-pan-right'

export interface CutsceneSlide {
  image: string
  title: string
  body: string
  motion: KenBurnsMotion
}

export interface CutsceneDef {
  id: CutsceneId
  label: string
  slides: CutsceneSlide[]
  /** Show Skip control (intro only) */
  allowSkip: boolean
}

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  intro: {
    id: 'intro',
    label: 'Story',
    allowSkip: true,
    slides: [
      {
        image: '/art/Scene1.png',
        title: 'You have been chosen',
        body: 'Ha Long is suffering from boredom. Only the best public speaker can bring this crowd back before we lose them for good. So you have been chosen as the master of ceremonies — the MC.',
        motion: 'ken-pan-left',
      },
      {
        image: '/art/Scene2.png',
        title: 'The city is fading',
        body: 'In the street cafés, people sit quiet and tired. The smile has left Ha Long — even a small hello feels heavy.',
        motion: 'ken-zoom-in',
      },
      {
        image: '/art/Scene3.png',
        title: 'Even joy feels empty',
        body: 'The mall is full of cracks and empty faces. Shops wait. Escalators wait. Nobody is really listening.',
        motion: 'ken-pan-right',
      },
      {
        image: '/art/afflicted_group.png',
        title: 'The crowd is fading',
        body: 'An old man, a lady, and a young girl start drained by boredom. Match your delivery and lift them — bored, then curious, then engaged. Cheer unlocks as you cure each person, chapter by chapter.',
        motion: 'ken-zoom-in',
      },
    ],
  },
  thaw: {
    id: 'thaw',
    label: 'Ha Long wakes',
    allowSkip: true,
    slides: [
      {
        image: '/art/Scene1b.png',
        title: 'Ha Long is waking up',
        body: 'The plaza feels lighter. Some people still look tired — but others stand taller. Your voice is starting to work.',
        motion: 'ken-pan-left',
      },
      {
        image: '/art/Scene4.png',
        title: 'The café smiles again',
        body: 'Warm light returns to the quán cà phê. Friends raise their glasses. Boredom is losing its hold.',
        motion: 'ken-zoom-in',
      },
      {
        image: '/art/Scene3b.png',
        title: 'People are listening again',
        body: 'In the mall, shops open and faces brighten. Keep going — Ha Long still needs its MC.',
        motion: 'ken-pan-right',
      },
    ],
  },
  ending: {
    id: 'ending',
    label: 'The final stage',
    allowSkip: true,
    slides: [
      {
        image: '/art/Scene6.png',
        title: 'They came to hear you',
        body: 'You spoke. The crowd stayed. Even famous faces showed up — and behind them a sign says what Ha Long feels: you saved us!',
        motion: 'ken-zoom-in',
      },
    ],
  },
}

export function getCutscene(id: CutsceneId): CutsceneDef {
  return CUTSCENES[id]
}
