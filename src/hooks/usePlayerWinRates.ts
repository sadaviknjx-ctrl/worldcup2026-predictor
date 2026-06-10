import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { PlayerWinRate, Tier } from '@/types'

export interface PlayerWinRateAgg {
  player_id: number
  name: string
  name_zh?: string | null
  photo_url?: string | null
  appearances: number
  wins: number
  draws: number
  losses: number
  winRate: number // 0–100
}

interface Options {
  tier?: Tier | Tier[]
  startersOnly?: boolean
  minAppearances?: number
}

/**
 * Reads the `player_win_rates` view (grouped by tier + starter flag) and
 * collapses it to one row per player with a computed win-rate percentage.
 * This is the "颗粒度到球员个人" stat — filterable by competition tier.
 */
export function usePlayerWinRates({ tier, startersOnly, minAppearances = 3 }: Options = {}) {
  const [rows, setRows] = useState<PlayerWinRateAgg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase.from('player_win_rates').select('*')
    if (tier) query = Array.isArray(tier) ? query.in('tier', tier) : query.eq('tier', tier)
    if (startersOnly) query = query.eq('is_starter', true)

    const { data, error } = await query
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Collapse multiple tier/is_starter rows per player into one aggregate
    const byPlayer = new Map<number, PlayerWinRate & { appearances: number; wins: number; draws: number; losses: number }>()
    for (const row of (data ?? []) as PlayerWinRate[]) {
      const existing = byPlayer.get(row.player_id)
      if (existing) {
        existing.appearances += row.appearances
        existing.wins += row.wins
        existing.draws += row.draws
        existing.losses += row.losses
      } else {
        byPlayer.set(row.player_id, { ...row })
      }
    }

    const agg: PlayerWinRateAgg[] = Array.from(byPlayer.values())
      .filter((r) => r.appearances >= minAppearances)
      .map((r) => ({
        player_id: r.player_id,
        name: r.name,
        name_zh: r.name_zh,
        photo_url: r.photo_url,
        appearances: r.appearances,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        winRate: r.appearances > 0 ? Math.round((r.wins / r.appearances) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.winRate - a.winRate || b.appearances - a.appearances)

    setRows(agg)
    setLoading(false)
  }, [tier, startersOnly, minAppearances])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  return { players: rows, loading, error, refetch: fetchRows }
}
