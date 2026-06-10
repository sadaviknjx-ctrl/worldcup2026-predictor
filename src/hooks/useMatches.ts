import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Match, Tier } from '@/types'

interface UseMatchesOptions {
  tier?: Tier | Tier[]
  status?: Match['status']
  limit?: number
}

/**
 * Fetches matches joined with team info, ordered by tier (priority) then date.
 * Tier 1 (2026 WC) always sorts first regardless of date.
 */
export function useMatches({ tier, status, limit = 50 }: UseMatchesOptions = {}) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        competition:competitions(*)
      `)
      .order('tier', { ascending: true })
      .order('match_date', { ascending: true })
      .limit(limit)

    if (tier) {
      query = Array.isArray(tier) ? query.in('tier', tier) : query.eq('tier', tier)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) setError(error.message)
    else setMatches((data ?? []) as unknown as Match[])
    setLoading(false)
  }, [tier, status, limit])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  return { matches, loading, error, refetch: fetchMatches }
}
