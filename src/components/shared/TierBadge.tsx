import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'

const TIER_CONFIG: Record<Tier, { label: string; stars: number; className: string }> = {
  1: { label: '2026 世界杯', stars: 3, className: 'border-wc-yellow/40 bg-wc-yellow/10 text-wc-yellow' },
  2: { label: '历届世界杯', stars: 2, className: 'border-wc-blue/40 bg-wc-blue/10 text-blue-300' },
  3: { label: '其他联赛', stars: 1, className: 'border-border bg-muted text-muted-foreground' },
}

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  const cfg = TIER_CONFIG[tier]
  return (
    <Badge variant="outline" className={cn('gap-1', cfg.className, className)}>
      {Array.from({ length: cfg.stars }).map((_, i) => (
        <Star key={i} className="h-2.5 w-2.5 fill-current" />
      ))}
      {cfg.label}
    </Badge>
  )
}
