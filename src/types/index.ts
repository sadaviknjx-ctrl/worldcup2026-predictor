// ─── Tier priority ────────────────────────────────────────────────────────────
// 1 = 2026 World Cup · 2 = Historical World Cups · 3 = Other leagues (reference only)
export type Tier = 1 | 2 | 3
export type CompetitionType = 'WC_2026' | 'WC_HISTORICAL' | 'OTHER'

export interface Competition {
  id: number
  name: string
  type: CompetitionType
  tier: Tier
  logo_url?: string | null
  country?: string | null
}

export interface Team {
  id: number
  name: string
  name_zh?: string | null
  flag_emoji?: string | null
  logo_url?: string | null
  country?: string | null
}

export interface Player {
  id: number
  name: string
  name_zh?: string | null
  photo_url?: string | null
  nationality?: string | null
  position?: string | null
  current_team_id?: number | null
}

export type MatchStatus = 'upcoming' | 'live' | 'finished'

export interface Match {
  id: number
  competition_id: number
  tier: Tier
  round?: string | null
  home_team_id: number
  away_team_id: number
  home_score: number | null
  away_score: number | null
  match_date: string
  venue?: string | null
  venue_city?: string | null
  status: MatchStatus
  // joined fields (populated client-side)
  home_team?: Team
  away_team?: Team
  competition?: Competition
}

export interface MatchLineup {
  id: number
  match_id: number
  player_id: number
  team_id: number
  is_starter: boolean
  minutes_played: number | null
  goals: number
  assists: number
  rating: number | null
  yellow_cards: number
  red_cards: number
}

// Aggregated from the `player_win_rates` SQL view
export interface PlayerWinRate {
  player_id: number
  name: string
  name_zh?: string | null
  photo_url?: string | null
  tier: Tier
  is_starter: boolean
  appearances: number
  wins: number
  draws: number
  losses: number
}

export interface Prediction {
  id: number
  match_id: number
  predicted_home_score: number
  predicted_away_score: number
  points_earned?: number | null
  created_at: string
}

export interface SyncLog {
  id: number
  source: string
  scope: string
  status: 'success' | 'error'
  detail?: string | null
  ran_at: string
}
