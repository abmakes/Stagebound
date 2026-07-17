import type { SkillId } from './types'

export interface TrainQuestion {
  id: string
  prompt: string
  /** Related skill for flavor */
  skill: SkillId
  choices: string[]
  correctIndex: number
}

/** Class review — mix of scenarios and short definitions */
export const TRAIN_QUESTIONS: TrainQuestion[] = [
  {
    id: 't1',
    prompt: 'You greet the crowd. Which face fits best?',
    skill: 'emotion',
    choices: ['Smile (friendly)', 'Serious face', 'Concerned face', 'Angry face'],
    correctIndex: 0,
  },
  {
    id: 't2',
    prompt: 'You talk about river pollution harming animals. Best face?',
    skill: 'emotion',
    choices: ['Excited face', 'Smile only', 'Concerned or serious', 'Look at your shoes'],
    correctIndex: 2,
  },
  {
    id: 't3',
    prompt: 'A child in the front row looks scared. You want to calm them. Best volume?',
    skill: 'volume',
    choices: [
      'Shout the next line',
      'Soft, clear voice — still easy to hear',
      'No voice — only mime',
      'Talk only to the back row',
    ],
    correctIndex: 1,
  },
  {
    id: 't4',
    prompt: 'A strong “We MUST act now” line needs which tone?',
    skill: 'tone',
    choices: ['Friendly soft tone', 'Serious / urgent tone', 'Bored flat tone', 'Whisper only'],
    correctIndex: 1,
  },
  {
    id: 't5',
    prompt: 'You list three tips: reduce, reuse, recycle. Best gesture?',
    skill: 'gesture',
    choices: ['Hand on chest', 'Count on fingers', 'Hands in pockets', 'Nervous pacing'],
    correctIndex: 1,
  },
  {
    id: 't6',
    prompt: 'You are checking one hard place name on your card, then look up. Where should your eyes go next?',
    skill: 'emotion',
    choices: [
      'Stay on your notes the whole time',
      'Glance at notes, then look at the audience',
      'Close your eyes and hope',
      'Only watch one friend',
    ],
    correctIndex: 1,
  },
  {
    id: 't7',
    prompt: 'You share a feeling: “I feel sad when rivers are dirty.” Best gesture?',
    skill: 'gesture',
    choices: ['Hand chop', 'Hand on chest', 'Count to five', 'Wave randomly'],
    correctIndex: 1,
  },
  {
    id: 't8',
    prompt: 'You are in a JOB speech. Which line belongs?',
    skill: 'stress',
    choices: [
      'Plastic kills turtles in our river.',
      'My dream job is a game designer.',
      'Come with me. Japan is waiting.',
      'We pick up trash on the street.',
    ],
    correctIndex: 1,
  },
  {
    id: 't9',
    prompt: 'Good stance for an MC means…',
    skill: 'stance',
    choices: [
      'Slouch and hide hands',
      'Tall, open, feet steady — move only with purpose',
      'Pace left and right the whole time',
      'Turn your back to the crowd',
    ],
    correctIndex: 1,
  },
  {
    id: 't10',
    prompt: 'Nervous pacing usually…',
    skill: 'stance',
    choices: [
      'Helps the crowd trust you',
      'Distracts from your message',
      'Replaces eye contact',
      'Is required in every speech',
    ],
    correctIndex: 1,
  },
  {
    id: 't11',
    prompt: 'You say “Japan” in a travel pitch. What should you do?',
    skill: 'stress',
    choices: [
      'Mumble it quickly',
      'Say the place name clearly and pause a little',
      'Replace it with “that country”',
      'Shout every syllable',
    ],
    correctIndex: 1,
  },
  {
    id: 't12',
    prompt: 'When should you pause?',
    skill: 'pause',
    choices: [
      'After every single word',
      'After an important idea, so people can think',
      'Never — keep rushing',
      'Only when you forget your line',
    ],
    correctIndex: 1,
  },
  {
    id: 't13',
    prompt: 'Comedy, heart, or fire — what is the same for all three style lines?',
    skill: 'emotion',
    choices: [
      'They are all wrong on purpose',
      'They can all be correct — you choose the feeling',
      'Only comedy ever works',
      'You must shout all three',
    ],
    correctIndex: 1,
  },
  {
    id: 't14',
    prompt: 'Mime is useful when…',
    skill: 'gesture',
    choices: [
      'You describe an action (pick up trash, draw, cook)',
      'You say thank you',
      'You are angry at the crowd',
      'You want to hide your hands',
    ],
    correctIndex: 0,
  },
  {
    id: 't15',
    prompt: 'An MC’s job on stage is closest to…',
    skill: 'emotion',
    choices: [
      'Ignore the audience',
      'Guide the show with clear voice, face, and body',
      'Only read a script looking down',
      'Talk as fast as possible',
    ],
    correctIndex: 1,
  },
]

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function pickTrainSet(count = 5): TrainQuestion[] {
  const pool = shuffleInPlace([...TRAIN_QUESTIONS])
  return pool.slice(0, count).map((q) => {
    const indexed = q.choices.map((text, i) => ({ text, i }))
    shuffleInPlace(indexed)
    return {
      ...q,
      choices: indexed.map((c) => c.text),
      correctIndex: indexed.findIndex((c) => c.i === q.correctIndex),
    }
  })
}
