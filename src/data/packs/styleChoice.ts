import type { DeliveryChoice, SentenceOption } from '../types'

/** Three all-correct climax lines: comedy / heart / fire */
export function styleTrio(lines: {
  comedy: { text: string; words: string[]; goodStress?: string[]; clearWords?: string[] }
  heart: { text: string; words: string[]; goodStress?: string[]; clearWords?: string[] }
  fire: { text: string; words: string[]; goodStress?: string[]; clearWords?: string[] }
}): SentenceOption[] {
  return [
    {
      id: 'comedy',
      text: lines.comedy.text,
      words: lines.comedy.words,
      goodStress: lines.comedy.goodStress,
      clearWords: lines.comedy.clearWords,
      isCorrect: true,
      style: 'comedy',
      audienceFlavor: 'laugh',
      styleDelivery: {
        emotion: 'smile',
        tone: 'friendly',
        gesture: 'open_palms',
        volume: 'clear',
      },
    },
    {
      id: 'heart',
      text: lines.heart.text,
      words: lines.heart.words,
      goodStress: lines.heart.goodStress,
      clearWords: lines.heart.clearWords,
      isCorrect: true,
      style: 'heart',
      audienceFlavor: 'compassion',
      styleDelivery: {
        emotion: 'concerned',
        tone: 'hopeful',
        gesture: 'hand_chest',
        volume: 'soft',
      },
    },
    {
      id: 'fire',
      text: lines.fire.text,
      words: lines.fire.words,
      goodStress: lines.fire.goodStress,
      clearWords: lines.fire.clearWords,
      isCorrect: true,
      style: 'fire',
      audienceFlavor: 'passion',
      styleDelivery: {
        emotion: 'serious',
        tone: 'serious',
        gesture: 'step_forward',
        volume: 'strong',
        stance: 'tall_open',
      },
    },
  ]
}

export const STYLE_BASE_EXPECTED: DeliveryChoice = {
  eyes: 'scan',
  pause: 'after',
}
