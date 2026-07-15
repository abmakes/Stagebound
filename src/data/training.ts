import type { SkillId } from './types'

export interface TrainQuestion {
  id: string
  prompt: string
  /** Related skill for flavor */
  skill: SkillId
  choices: string[]
  correctIndex: number
}

/** Class review: match definitions to MC delivery skills */
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
    prompt: 'Tone means…',
    skill: 'tone',
    choices: [
      'How loud you shout',
      'The feeling color of your voice (serious, friendly…)',
      'Where you stand on stage',
      'How many fingers you show',
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
    prompt: 'Two points: plastic hurts animals AND fills the ocean. Best gesture?',
    skill: 'gesture',
    choices: ['Two hands, one then the other', 'Only smile', 'Look at notes', 'Slouch'],
    correctIndex: 0,
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
    prompt: 'A firm claim “We must stop wasting water” often uses…',
    skill: 'gesture',
    choices: ['Hand chop', 'Hands in pockets', 'Looking down', 'No movement ever'],
    correctIndex: 0,
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
    prompt: 'Back-of-the-room volume means…',
    skill: 'volume',
    choices: [
      'Shout until it hurts',
      'Speak clear and strong enough for the back row — not a yell',
      'Always whisper',
      'Only talk to one friend',
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
    prompt: 'Word stress means…',
    skill: 'stress',
    choices: [
      'Say “the” and “a” louder',
      'Make the key word stand out (must, river, Japan…)',
      'Read every word the same',
      'Stress only Vietnamese words',
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

export function pickTrainSet(count = 5): TrainQuestion[] {
  const shuffled = [...TRAIN_QUESTIONS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
