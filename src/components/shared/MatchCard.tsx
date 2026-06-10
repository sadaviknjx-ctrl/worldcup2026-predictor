import { useState } from 'react'
import { Calendar, MapPin, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TierBadge } from '@/components/shared/TierBadge'
import { WinProbBar } from '@/components/shared/WinProbBar'
import { BettingAdvice } from '@/components/shared/BettingAdvice'
import { type Match, type Prediction } from '@/types'
import { type MatchProbability } from '@/hooks/usePredictionEngine'
import { type MatchOdds } from '@/hooks/useMatchOdds'
import { useTeamForm, useTeamH2H } from '@/hooks/useTeamH2H'
import { cn, formatMatchDate } from '@/lib/utils'

interface MatchCardProps {
  match: Match
  prediction?: Prediction
  onSavePrediction?: (matchId: number, home: number, away: number) => Promise<void> | void
  algoPrediction?: MatchProbability
  matchOdds?: MatchOdds        // passed from parent (bulk-fetched)
  showTier?: boolean
  hideRound?: boolean
  wcYear?: number
}

export function MatchCard({
  match, prediction, onSavePrediction, algoPrediction,
  matchOdds, showTier, hideRound, wcYear,
}: MatchCardProps) {
  const isFinished = match.status === 'finished'
  const isLive     = match.status === 'live'
  const isUpcoming = match.status === 'upcoming'

  // Only fetch H2H/form for upcoming tier-1 cards (to avoid N×3 queries on history page)
  const showBetting = isUpcoming && match.tier === 1
  const { form: homeForm } = useTeamForm(showBetting ? match.home_team_id : null)
  const { form: awayForm } = useTeamForm(showBetting ? match.away_team_id : null)
  const { h2h } = useTeamH2H(
    showBetting ? match.home_team_id : null,
    showBetting ? match.away_team_id : null,
  )

  const [editing, setEditing] = useState(false)
  const [home, setHome] = useState(prediction?.predicted_home_score ?? 0)
  const [away, setAway] = useState(prediction?.predicted_away_score ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSavePrediction) return
    setSaving(true)
    await onSavePrediction(match.id, home, away)
    setSaving(false)
    setEditing(false)
  }

  const homeName = match.home_team?.name_zh ?? match.home_team?.name ?? '待定'
  const awayName = match.away_team?.name_zh ?? match.away_team?.name ?? '待定'

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:border-wc-blue/50 hover:shadow-lg hover:shadow-wc-blue/5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {showTier && <TierBadge tier={match.tier} />}
          {wcYear && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-wc-blue/15 text-wc-blue border border-wc-blue/20">
              {wcYear} WC
            </span>
          )}
          {!hideRound && match.round && (
            <span>{match.round.replace('- Matchday', '· MD').replace('Group Stage', 'GS')}</span>
          )}
        </div>
        <Badge variant={isLive ? 'live' : isFinished ? 'finished' : 'upcoming'}>
          {isLive ? '● 直播中' : isFinished ? '已结束' : '即将开始'}
        </Badge>
      </div>

      <CardContent className="p-4">
        {/* Teams & score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-1">
            <span className="text-2xl">{match.home_team?.flag_emoji ?? '🏳️'}</span>
            <span className="text-sm font-semibold text-center">{homeName}</span>
          </div>

          <div className="flex min-w-[90px] flex-col items-center gap-1">
            {isFinished || isLive ? (
              <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
                <span className={isLive ? 'text-wc-yellow' : ''}>{match.home_score ?? 0}</span>
                <span className="text-muted-foreground">–</span>
                <span className={isLive ? 'text-wc-yellow' : ''}>{match.away_score ?? 0}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-muted-foreground">VS</span>
            )}
            {prediction && !editing && (
              <span className="flex items-center gap-1 text-xs text-wc-yellow">
                <Check className="h-3 w-3" />
                我猜 {prediction.predicted_home_score}:{prediction.predicted_away_score}
                {prediction.points_earned != null && (
                  <span className="text-muted-foreground">(+{prediction.points_earned}分)</span>
                )}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col items-center gap-1">
            <span className="text-2xl">{match.away_team?.flag_emoji ?? '🏳️'}</span>
            <span className="text-sm font-semibold text-center">{awayName}</span>
          </div>
        </div>

        {/* Algorithm probability bar */}
        {algoPrediction && (
          <div className="mt-3 border-t border-border/50 pt-3">
            <WinProbBar prob={algoPrediction} homeName={homeName} awayName={awayName} />
          </div>
        )}

        {/* Betting advice — upcoming 2026 matches only */}
        {showBetting && (
          <BettingAdvice
            odds={matchOdds ?? null}
            algo={algoPrediction ?? null}
            homeName={homeName}
            awayName={awayName}
            h2h={h2h ?? null}
            homeForm={homeForm}
            awayForm={awayForm}
          />
        )}

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatMatchDate(match.match_date)}
          </div>
          {match.venue_city && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {match.venue_city}
            </div>
          )}
        </div>

        {/* Prediction input */}
        {isUpcoming && onSavePrediction && (
          <div className="mt-3 border-t border-border pt-3">
            {editing ? (
              <div className="flex items-center justify-center gap-2">
                <Input
                  type="number" min={0} max={20} value={home}
                  onChange={(e) => setHome(Number(e.target.value))}
                  className="h-9 w-16 text-center"
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  type="number" min={0} max={20} value={away}
                  onChange={(e) => setAway(Number(e.target.value))}
                  className="h-9 w-16 text-center"
                />
                <Button size="sm" variant="wc-gold" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中…' : '保存'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>取消</Button>
              </div>
            ) : (
              <Button
                variant="outline" size="sm"
                className={cn(
                  'w-full border-wc-blue/30 hover:border-wc-blue hover:bg-wc-blue/10 hover:text-white',
                  prediction && 'border-wc-yellow/30 hover:border-wc-yellow hover:bg-wc-yellow/10',
                )}
                onClick={() => setEditing(true)}
              >
                {prediction ? '修改预测比分' : '+ 预测比分'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
