import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface MatchOdds {
  match_id: number
  home_odds: number
  draw_odds: number
  away_odds: number
  bookmaker_count: number
  fetched_at: string
}

export function useMatchOdds(matchIds: number[]) {
  const [odds, setOdds] = useState<Record<number, MatchOdds>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (matchIds.length === 0) return
    setLoading(true)
    supabase
      .from('match_odds')
      .select('*')
      .in('match_id', matchIds)
      .then(({ data }) => {
        const map: Record<number, MatchOdds> = {}
        for (const row of data ?? []) map[row.match_id] = row
        setOdds(map)
        setLoading(false)
      })
  }, [matchIds.join(',')])

  return { odds, loading }
}
