import type { MetaState } from '../data/types'
import { FINALS } from '../data/finals'

export interface StageboundScoreBreakdown {
  total: number
  accuracyPct: number
  finalsPct: number
  efficiencyPct: number
  accuracyPoints: number
  finalsPoints: number
  efficiencyPoints: number
}

/** Stagebound Score 0–1000 */
export function computeStageboundScore(meta: MetaState): StageboundScoreBreakdown {
  const accuracyPct =
    meta.choicesCorrect + meta.choicesWrong > 0
      ? meta.choicesCorrect / (meta.choicesCorrect + meta.choicesWrong)
      : 0

  const finalsCleared = FINALS.filter((f) => meta.chaptersCleared.includes(f.id)).length
  const finalsAvg =
    meta.finalsMatchSum > 0 && meta.finalsMatchCount > 0
      ? meta.finalsMatchSum / meta.finalsMatchCount
      : finalsCleared > 0
        ? 0.7
        : 0

  // Efficiency: start 1.0, lose for failures, soft floor 0.2
  const fails = meta.stageFails || 0
  const attempts = meta.stageAttempts || 0
  let efficiency = 1
  efficiency -= Math.min(0.6, fails * 0.08)
  if (attempts > 15) efficiency -= Math.min(0.2, (attempts - 15) * 0.02)
  if (meta.chaptersCleared.includes('final-5-championship') && attempts <= 14) {
    efficiency = Math.min(1, efficiency + 0.1)
  }
  efficiency = Math.max(0.2, Math.min(1, efficiency))

  const accuracyPoints = Math.round(accuracyPct * 600)
  const finalsPoints = Math.round(finalsAvg * 250)
  const efficiencyPoints = Math.round(efficiency * 150)
  const total = Math.min(1000, accuracyPoints + finalsPoints + efficiencyPoints)

  return {
    total,
    accuracyPct,
    finalsPct: finalsAvg,
    efficiencyPct: efficiency,
    accuracyPoints,
    finalsPoints,
    efficiencyPoints,
  }
}
