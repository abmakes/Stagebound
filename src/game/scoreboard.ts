import type { MetaState } from '../data/types'
import { ALL_CHAPTERS } from '../data/curriculum'
import { FINALS } from '../data/finals'

export interface StageboundScoreBreakdown {
  total: number
  /** Cleared chapters / all chapters */
  progressPct: number
  /** Best delivery quality on cleared chapters (0–1) */
  qualityPct: number
  /** Best quality on finals only (0–1; missing finals count as 0) */
  finalsPct: number
  progressPoints: number
  qualityPoints: number
  finalsPoints: number
  chaptersCleared: number
  chaptersTotal: number
  /** @deprecated aliases for older UI / leaderboard fields */
  accuracyPct: number
  efficiencyPct: number
  accuracyPoints: number
  efficiencyPoints: number
}

const PROGRESS_MAX = 450
const QUALITY_MAX = 350
const FINALS_MAX = 200

function chapterBestRatio(meta: MetaState, chapterId: string): number | null {
  const best = meta.bestScore[chapterId]
  const max = meta.bestMaxScore[chapterId]
  if (typeof best !== 'number' || typeof max !== 'number' || max <= 0) return null
  return Math.max(0, Math.min(1, best / max))
}

/**
 * Stagebound Score 0–1000 — rewards progress, delivery quality, and finals.
 *
 * - Progress (450): rise every time you clear a new chapter
 * - Quality (350): how well you played cleared chapters, scaled by how far you are
 * - Finals (200): best ratio on each of the 3 finals (uncleared = 0)
 *
 * Early perfect play cannot hit 750 before mid-game; finishing levels always moves the score.
 */
export function computeStageboundScore(meta: MetaState): StageboundScoreBreakdown {
  const chaptersTotal = ALL_CHAPTERS.length
  const clearedIds = ALL_CHAPTERS.map((c) => c.id).filter((id) => meta.chaptersCleared.includes(id))
  const chaptersCleared = clearedIds.length
  const progressPct = chaptersTotal ? chaptersCleared / chaptersTotal : 0
  const progressPoints = Math.round(progressPct * PROGRESS_MAX)

  const clearedRatios = clearedIds
    .map((id) => chapterBestRatio(meta, id))
    .filter((r): r is number => r !== null)
  const avgClearedQuality =
    clearedRatios.length > 0 ? clearedRatios.reduce((a, b) => a + b, 0) / clearedRatios.length : 0
  // Scale by progress so 1 perfect chapter cannot award full quality points
  const qualityPct = avgClearedQuality * progressPct
  const qualityPoints = Math.round(qualityPct * QUALITY_MAX)

  const finalRatios = FINALS.map((f) => {
    if (!meta.chaptersCleared.includes(f.id)) return 0
    return chapterBestRatio(meta, f.id) ?? 0
  })
  const finalsPct =
    FINALS.length > 0 ? finalRatios.reduce((a, b) => a + b, 0) / FINALS.length : 0
  const finalsPoints = Math.round(finalsPct * FINALS_MAX)

  const total = Math.min(1000, progressPoints + qualityPoints + finalsPoints)

  return {
    total,
    progressPct,
    qualityPct: avgClearedQuality,
    finalsPct,
    progressPoints,
    qualityPoints,
    finalsPoints,
    chaptersCleared,
    chaptersTotal,
    accuracyPct: avgClearedQuality,
    efficiencyPct: progressPct,
    accuracyPoints: qualityPoints,
    efficiencyPoints: progressPoints,
  }
}

/** Apply score after a run; returns previous and new totals for UI. */
export function refreshStageboundScore(meta: MetaState): {
  meta: MetaState
  previous: number
  current: number
  best: number
  raised: boolean
} {
  const previous = meta.bestStageboundScore || 0
  const current = computeStageboundScore(meta).total
  const best = Math.max(previous, current)
  const raised = current > previous
  return {
    meta: {
      ...meta,
      bestStageboundScore: best,
    },
    previous: meta.bestStageboundScore || 0,
    current,
    best,
    raised,
  }
}
