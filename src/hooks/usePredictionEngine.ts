import { useCallback } from 'react'
import { useTeamStats, type TeamStatsMap } from './useTeamStats'

const TOTAL_WC2026_GROUP_MATCHES = 72

export interface MatchProbability {
  homeWinPct: number   // 0–100, rounded
  drawPct: number
  awayWinPct: number
  /** How much historical data backs this prediction */
  confidence: 'none' | 'low' | 'medium' | 'high'
  /** Weights actually used, so the UI can explain itself */
  weights: { wc2026: number; wc2022: number; wc2018: number }
}

/** Dynamic weights based on how many 2026 matches have already finished */
function getDynamicWeights(finishedWC2026: number) {
  // Cap at 50 % — historical context always retains at least half the weight
  const wc2026 = Math.min(finishedWC2026 / TOTAL_WC2026_GROUP_MATCHES, 0.5)
  const hist = 1 - wc2026
  return {
    wc2026,
    wc2022: hist * 0.65,
    wc2018: hist * 0.35,
  }
}

/**
 * Score a team's historical WC performance on a 0–1 scale.
 * Uses points-per-game normalised against the theoretical max (3 pts / game).
 * Teams with no data for a particular year fall back to the global WC average
 * (≈1.3 pts/game → 0.43 normalised).
 */
function scoreTeam(
  teamId: number,
  stats: TeamStatsMap,
  weights: ReturnType<typeof getDynamicWeights>,
): { score: number; hasData: boolean } {
  const AVG_PPG = 1.3 / 3   // global WC average normalised to 0–1

  const r2026 = stats[teamId]?.[2026]
  const r2022 = stats[teamId]?.[2022]
  const r2018 = stats[teamId]?.[2018]

  const ppg2026 = r2026?.matches ? r2026.pointsPerGame / 3 : AVG_PPG
  const ppg2022 = r2022?.matches ? r2022.pointsPerGame / 3 : AVG_PPG
  const ppg2018 = r2018?.matches ? r2018.pointsPerGame / 3 : AVG_PPG

  const score =
    ppg2026 * weights.wc2026 +
    ppg2022 * weights.wc2022 +
    ppg2018 * weights.wc2018

  const hasData = !!(r2022?.matches || r2018?.matches || r2026?.matches)
  return { score, hasData }
}

export function usePredictionEngine() {
  const { stats, finishedWC2026Count, loading } = useTeamStats()
  const weights = getDynamicWeights(finishedWC2026Count)

  const predict = useCallback(
    (homeTeamId: number, awayTeamId: number): MatchProbability => {
      const defaultResult: MatchProbability = {
        homeWinPct: 38, drawPct: 24, awayWinPct: 38,
        confidence: 'none', weights,
      }
      if (loading) return defaultResult

      const home = scoreTeam(homeTeamId, stats, weights)
      const away = scoreTeam(awayTeamId, stats, weights)
      const total = home.score + away.score

      if (total === 0) return defaultResult

      const ratio = home.score / total  // >0.5 → home favoured

      // Draw probability peaks when teams are evenly matched
      const evenness = 1 - 2 * Math.abs(ratio - 0.5)  // 0=one-sided, 1=perfectly even
      const rawDraw = 0.27 * evenness * 100

      const remaining = 100 - rawDraw
      const HOME_ADVANTAGE = 1.08
      const rawHome = ratio * remaining * HOME_ADVANTAGE
      const rawAway = (1 - ratio) * remaining / HOME_ADVANTAGE

      // Normalise so the three values sum to exactly 100
      const sum = rawHome + rawDraw + rawAway
      const homeWinPct = Math.round((rawHome / sum) * 100)
      const awayWinPct = Math.round((rawAway / sum) * 100)
      const drawPct = 100 - homeWinPct - awayWinPct

      const confidence: MatchProbability['confidence'] =
        !home.hasData && !away.hasData ? 'none' :
        (!home.hasData || !away.hasData) ? 'low' :
        finishedWC2026Count > 20 ? 'high' : 'medium'

      return { homeWinPct, drawPct, awayWinPct, confidence, weights }
    },
    [stats, finishedWC2026Count, loading, weights],
  )

  return { predict, loading, weights, finishedWC2026Count }
}
