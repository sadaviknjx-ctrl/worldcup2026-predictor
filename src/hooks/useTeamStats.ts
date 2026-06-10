import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface TeamRecord {
  wins: number
  draws: number
  losses: number
  matches: number
  winRate: number       // 0-1
  pointsPerGame: number // 0-3
  year: number
}

/** keyed by teamId → year → record */
export type TeamStatsMap = Record<number, Record<number, TeamRecord>>

export function useTeamStats() {
  const [stats, setStats] = useState<TeamStatsMap>({})
  const [finishedWC2026Count, setFinishedWC2026Count] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score, match_date, tier, competition_id')
        .eq('status', 'finished')
        .in('tier', [1, 2])

      if (error || !matches) { setLoading(false); return }

      const map: TeamStatsMap = {}

      function add(teamId: number, win: boolean, draw: boolean, year: number) {
        if (!map[teamId]) map[teamId] = {}
        if (!map[teamId][year]) {
          map[teamId][year] = { wins: 0, draws: 0, losses: 0, matches: 0, winRate: 0, pointsPerGame: 0, year }
        }
        const r = map[teamId][year]
        r.matches++
        if (draw) r.draws++
        else if (win) r.wins++
        else r.losses++
        r.winRate = r.wins / r.matches
        r.pointsPerGame = (r.wins * 3 + r.draws) / r.matches
      }

      let wc2026Finished = 0

      for (const m of matches) {
        if (m.home_score === null || m.away_score === null) continue
        const year = new Date(m.match_date).getFullYear()
        const draw = m.home_score === m.away_score
        const homeWins = m.home_score > m.away_score

        add(m.home_team_id, homeWins, draw, year)
        add(m.away_team_id, !homeWins && !draw, draw, year)

        // Competition 10001 = WC_2026; tier 1 also covers it
        if (m.competition_id === 10001 || (m.tier === 1 && year === 2026)) {
          wc2026Finished++
        }
      }

      setStats(map)
      setFinishedWC2026Count(wc2026Finished)
      setLoading(false)
    }
    fetch()
  }, [])

  return { stats, finishedWC2026Count, loading }
}
