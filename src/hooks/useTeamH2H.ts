// Computes H2H and recent form directly from our DB (2018 + 2022 WC data).
// No external API needed — uses existing matches table.

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface H2HRecord {
  wins: number          // team1 wins
  draws: number
  losses: number        // team1 losses
  goalsFor: number
  goalsAgainst: number
  matches: {
    date: string
    team1Score: number
    team2Score: number
    result: 'W' | 'D' | 'L'
  }[]
}

export interface FormEntry {
  result: 'W' | 'D' | 'L'
  goalsFor: number
  goalsAgainst: number
  opponentId: number
  date: string
  isHome: boolean
}

/** Last 5 WC matches for a team (from our tier-1/2 DB data) */
export function useTeamForm(teamId: number | null) {
  const [form, setForm] = useState<FormEntry[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!teamId) return
    setLoading(true)

    supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_score, away_score, match_date')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq('status', 'finished')
      .in('tier', [1, 2])
      .order('match_date', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        const entries: FormEntry[] = (data ?? []).map((m) => {
          const isHome = m.home_team_id === teamId
          const gf = isHome ? m.home_score : m.away_score
          const ga = isHome ? m.away_score : m.home_score
          const opp = isHome ? m.away_team_id : m.home_team_id
          const result: 'W' | 'D' | 'L' = gf > ga ? 'W' : gf === ga ? 'D' : 'L'
          return { result, goalsFor: gf ?? 0, goalsAgainst: ga ?? 0, opponentId: opp, date: m.match_date, isHome }
        })
        setForm(entries)
        setLoading(false)
      })
  }, [teamId])

  return { form, loading }
}

/** H2H record between two teams from our tier-1/2 DB data */
export function useTeamH2H(team1Id: number | null, team2Id: number | null) {
  const [h2h, setH2H] = useState<H2HRecord | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!team1Id || !team2Id) return
    setLoading(true)

    supabase
      .from('matches')
      .select('home_team_id, away_team_id, home_score, away_score, match_date')
      .or(
        `and(home_team_id.eq.${team1Id},away_team_id.eq.${team2Id}),` +
        `and(home_team_id.eq.${team2Id},away_team_id.eq.${team1Id})`
      )
      .eq('status', 'finished')
      .in('tier', [1, 2])
      .order('match_date', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        const rows = data ?? []
        let wins = 0, draws = 0, losses = 0, gf = 0, ga = 0
        const matches = rows.map((m) => {
          const t1IsHome = m.home_team_id === team1Id
          const t1Score = t1IsHome ? m.home_score : m.away_score
          const t2Score = t1IsHome ? m.away_score : m.home_score
          const result: 'W' | 'D' | 'L' = t1Score > t2Score ? 'W' : t1Score === t2Score ? 'D' : 'L'
          if (result === 'W') wins++
          else if (result === 'D') draws++
          else losses++
          gf += t1Score ?? 0
          ga += t2Score ?? 0
          return { date: m.match_date, team1Score: t1Score ?? 0, team2Score: t2Score ?? 0, result }
        })
        setH2H(rows.length > 0 ? { wins, draws, losses, goalsFor: gf, goalsAgainst: ga, matches } : null)
        setLoading(false)
      })
  }, [team1Id, team2Id])

  return { h2h, loading }
}
