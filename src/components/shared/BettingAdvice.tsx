import { cn } from '@/lib/utils'
import type { MatchOdds } from '@/hooks/useMatchOdds'
import type { MatchProbability } from '@/hooks/usePredictionEngine'
import type { H2HRecord, FormEntry } from '@/hooks/useTeamH2H'

interface Props {
  odds: MatchOdds | null
  algo: MatchProbability | null
  homeName: string
  awayName: string
  h2h: H2HRecord | null
  homeForm: FormEntry[]
  awayForm: FormEntry[]
}

// EV = probability × odds - 1   (>0 means value exists)
function calcEV(prob: number, odd: number): number {
  return +(prob / 100 * odd - 1).toFixed(3)
}

function EVBadge({ ev }: { ev: number }) {
  const pct = Math.round(ev * 100)
  if (ev >= 0.05) return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-green-900/40 text-green-400">
      +{pct}% ✓
    </span>
  )
  if (ev >= -0.05) return (
    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-yellow-900/30 text-yellow-500">
      {pct}% ≈
    </span>
  )
  return (
    <span className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {pct}%
    </span>
  )
}

function FormDots({ form }: { form: FormEntry[] }) {
  if (form.length === 0) return <span className="text-muted-foreground text-[11px]">暂无数据</span>
  return (
    <div className="flex gap-1">
      {form.map((f, i) => (
        <span
          key={i}
          title={`${f.goalsFor}-${f.goalsAgainst}`}
          className={cn(
            'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
            f.result === 'W' && 'bg-green-500/20 text-green-400',
            f.result === 'D' && 'bg-yellow-500/20 text-yellow-400',
            f.result === 'L' && 'bg-red-500/20 text-red-400',
          )}
        >
          {f.result}
        </span>
      ))}
    </div>
  )
}

export function BettingAdvice({ odds, algo, homeName, awayName, h2h, homeForm, awayForm }: Props) {
  const hasOdds = !!odds
  const hasAlgo = !!algo && algo.confidence !== 'none'

  // Best value pick (highest EV > 0)
  let bestPick: string | null = null
  let bestEV = -Infinity
  if (hasOdds && hasAlgo) {
    const candidates = [
      { label: `主胜 ${homeName}`, ev: calcEV(algo!.homeWinPct, odds!.home_odds) },
      { label: '平局',              ev: calcEV(algo!.drawPct,    odds!.draw_odds) },
      { label: `客胜 ${awayName}`,  ev: calcEV(algo!.awayWinPct, odds!.away_odds) },
    ]
    const top = candidates.reduce((a, b) => (a.ev > b.ev ? a : b))
    if (top.ev > 0) {
      bestPick = top.label
      bestEV = top.ev
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border/50 pt-3 text-xs">

      {/* ── 彩票赔率 + EV ── */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="font-semibold text-wc-yellow">🎟️ 彩票参考</span>
          {bestPick && (
            <span className="rounded bg-green-900/30 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
              推荐：{bestPick}（EV +{Math.round(bestEV * 100)}%）
            </span>
          )}
          {!bestPick && hasOdds && hasAlgo && (
            <span className="text-[10px] text-muted-foreground">暂无正期望值选项</span>
          )}
        </div>

        {hasOdds ? (
          <div className="grid grid-cols-3 gap-1 text-center">
            {[
              { label: '主胜', odds: odds!.home_odds, prob: algo?.homeWinPct },
              { label: '平局', odds: odds!.draw_odds, prob: algo?.drawPct },
              { label: '客胜', odds: odds!.away_odds, prob: algo?.awayWinPct },
            ].map(({ label, odds: o, prob }) => {
              const ev = prob != null ? calcEV(prob, o) : null
              return (
                <div
                  key={label}
                  className={cn(
                    'rounded-lg border p-2',
                    ev != null && ev >= 0.05
                      ? 'border-green-500/30 bg-green-900/10'
                      : 'border-border/50 bg-muted/20'
                  )}
                >
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-foreground">{o.toFixed(2)}</p>
                  {ev != null && <EVBadge ev={ev} />}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            赔率尚未发布 — 通常开赛前48h内出现
          </p>
        )}
        {hasOdds && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            来源：{odds!.bookmaker_count} 家博彩商均值 · 最低赔率保本线：
            主 ≥ {(100 / (algo?.homeWinPct || 1)).toFixed(2)} &nbsp;
            平 ≥ {(100 / (algo?.drawPct || 1)).toFixed(2)} &nbsp;
            客 ≥ {(100 / (algo?.awayWinPct || 1)).toFixed(2)}
          </p>
        )}
      </div>

      {/* ── H2H ── */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-muted-foreground">H2H</span>
        {h2h ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-green-400 font-semibold">{h2h.wins}胜</span>
            <span className="text-yellow-400 font-semibold">{h2h.draws}平</span>
            <span className="text-red-400 font-semibold">{h2h.losses}负</span>
            <span className="text-muted-foreground">
              ({h2h.goalsFor}:{h2h.goalsAgainst} 进失球)
            </span>
            <span className="text-[10px] text-muted-foreground">近{h2h.matches.length}次交锋</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-[11px]">无历届世界杯交锋记录</span>
        )}
      </div>

      {/* ── 近期状态 ── */}
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-muted-foreground">近况</span>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-12 truncate text-muted-foreground" title={homeName}>{homeName.slice(0,4)}</span>
            <FormDots form={homeForm} />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-12 truncate text-muted-foreground" title={awayName}>{awayName.slice(0,4)}</span>
            <FormDots form={awayForm} />
          </div>
        </div>
      </div>

    </div>
  )
}
