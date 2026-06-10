import { cn } from '@/lib/utils'
import type { MatchProbability } from '@/hooks/usePredictionEngine'

interface Props {
  prob: MatchProbability
  homeName: string
  awayName: string
  className?: string
}

const CONFIDENCE_LABEL: Record<MatchProbability['confidence'], string> = {
  none:   '暂无历史数据',
  low:    '历史数据不足',
  medium: '基于历届世界杯',
  high:   '含本届数据',
}

export function WinProbBar({ prob, className }: Props) {
  const { homeWinPct, drawPct, awayWinPct, confidence } = prob

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label row */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-medium text-wc-blue">算法预估</span>
        <span className={cn(
          'rounded px-1.5 py-0.5 text-[10px]',
          confidence === 'none'   ? 'bg-muted text-muted-foreground' :
          confidence === 'low'    ? 'bg-yellow-900/30 text-yellow-400' :
          confidence === 'medium' ? 'bg-wc-blue/10 text-wc-blue' :
                                    'bg-green-900/30 text-green-400'
        )}>
          {CONFIDENCE_LABEL[confidence]}
        </span>
      </div>

      {/* Bar */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-wc-blue transition-all"
          style={{ width: `${homeWinPct}%` }}
        />
        <div
          className="bg-muted-foreground/25 transition-all"
          style={{ width: `${drawPct}%` }}
        />
        <div
          className="bg-wc-red transition-all"
          style={{ width: `${awayWinPct}%` }}
        />
      </div>

      {/* Percentage row */}
      <div className="flex justify-between text-[11px]">
        <span className="font-semibold text-wc-blue">主 {homeWinPct}%</span>
        <span className="text-muted-foreground">平 {drawPct}%</span>
        <span className="font-semibold text-wc-red">{awayWinPct}% 客</span>
      </div>
    </div>
  )
}
