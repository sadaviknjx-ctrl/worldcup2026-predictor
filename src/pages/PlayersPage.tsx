import { useState } from 'react'
import { Users, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { usePlayerWinRates } from '@/hooks/usePlayerWinRates'
import { cn } from '@/lib/utils'
import type { Tier } from '@/types'

const SCOPE_TABS: { value: string; tier?: Tier | Tier[]; label: string }[] = [
  { value: 'wc2026', tier: 1, label: '2026 世界杯' },
  { value: 'wc_all', tier: [1, 2], label: '世界杯（全部）' },
  { value: 'all', tier: undefined, label: '全部赛事' },
]

function WinRateBar({ wins, draws, losses, appearances }: { wins: number; draws: number; losses: number; appearances: number }) {
  const pct = (n: number) => (appearances > 0 ? (n / appearances) * 100 : 0)
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="bg-green-500" style={{ width: `${pct(wins)}%` }} />
      <div className="bg-muted-foreground/40" style={{ width: `${pct(draws)}%` }} />
      <div className="bg-wc-red" style={{ width: `${pct(losses)}%` }} />
    </div>
  )
}

function PlayerWinRateList({ tier }: { tier?: Tier | Tier[] }) {
  const [startersOnly, setStartersOnly] = useState(false)
  const { players, loading, error } = usePlayerWinRates({ tier, startersOnly, minAppearances: 3 })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">至少 3 次出场，按胜率降序</p>
        <button
          onClick={() => setStartersOnly(!startersOnly)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            startersOnly
              ? 'border-wc-yellow/40 bg-wc-yellow/10 text-wc-yellow'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {startersOnly ? '✓ 仅看首发数据' : '仅看首发数据'}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          加载失败：{error}
        </div>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            暂无球员数据。运行同步函数（scope: lineups）后将显示个人出场胜率统计。
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {players.slice(0, 30).map((p, i) => (
                <div key={p.player_id} className="flex items-center gap-4 px-5 py-3">
                  <span className={cn('w-6 text-center text-sm font-bold', i < 3 ? 'text-wc-yellow' : 'text-muted-foreground')}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-sm">{p.name_zh ?? p.name}</span>
                      <span className="shrink-0 text-sm font-bold text-wc-yellow">{p.winRate}% 胜率</span>
                    </div>
                    <WinRateBar wins={p.wins} draws={p.draws} losses={p.losses} appearances={p.appearances} />
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>出场 {p.appearances}</span>
                      <span className="text-green-400">胜 {p.wins}</span>
                      <span>平 {p.draws}</span>
                      <span className="text-wc-red">负 {p.losses}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function PlayersPage() {
  const [scope, setScope] = useState('wc2026')
  const activeTier = SCOPE_TABS.find((s) => s.value === scope)?.tier

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wc-red/10">
          <Users className="h-5 w-5 text-wc-red" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">球员胜率看板</h1>
          <p className="text-sm text-muted-foreground">颗粒度精确到个人 — 该球员出场时球队的胜负分布</p>
        </div>
      </div>

      <Card className="border-wc-blue/20 bg-wc-blue/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-wc-blue-light" />
          <p className="text-xs text-muted-foreground">
            <span className="text-foreground font-medium">胜率</span> = 该球员出场比赛中，所属球队取胜的比例。
            可切换"仅看首发"以排除替补出场样本，更准确反映其影响力。
          </p>
        </CardContent>
      </Card>

      <Tabs value={scope} onValueChange={setScope}>
        <TabsList>
          {SCOPE_TABS.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>{s.label}</TabsTrigger>
          ))}
        </TabsList>
        {SCOPE_TABS.map((s) => (
          <TabsContent key={s.value} value={s.value}>
            {scope === s.value && <PlayerWinRateList tier={activeTier} />}
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end">
        <Badge variant="outline" className="text-xs text-muted-foreground">
          数据来源：API-Football · 仅统计已结束的比赛
        </Badge>
      </div>
    </div>
  )
}
