import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Prediction } from '@/types'

export function usePredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('predictions').select('*')
    setPredictions(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const upsertPrediction = useCallback(
    async (matchId: number, homeScore: number, awayScore: number) => {
      const { error } = await supabase.from('predictions').upsert(
        { match_id: matchId, predicted_home_score: homeScore, predicted_away_score: awayScore },
        { onConflict: 'match_id' },
      )
      if (!error) await fetchAll()
      return { error }
    },
    [fetchAll],
  )

  const byMatchId = useCallback(
    (matchId: number) => predictions.find((p) => p.match_id === matchId),
    [predictions],
  )

  // Personal accuracy summary — exact score = 3pts, correct result = 1pt
  const stats = {
    total: predictions.length,
    scored: predictions.filter((p) => p.points_earned !== null && p.points_earned !== undefined).length,
    totalPoints: predictions.reduce((sum, p) => sum + (p.points_earned ?? 0), 0),
    exactHits: predictions.filter((p) => p.points_earned === 3).length,
    resultHits: predictions.filter((p) => p.points_earned === 1).length,
  }

  return { predictions, loading, upsertPrediction, byMatchId, stats, refetch: fetchAll }
}
