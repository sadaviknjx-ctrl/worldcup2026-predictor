import { useState, useMemo } from 'react'
import { History } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { MatchCard } from '@/components/shared/MatchCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useMatches } from '@/hooks/useMatches'
import type { Match, Tier } from '@/types'

const TIER_TABS: { value: string; tier: Tier | Tier[]; label: string; hint: string }[] = [
  { value: 'historical', tier: 2, label: '历届世界杯', hint: '2018 & 2022 数据，按年份倒序' },
  { value: 'other', tier: 3, label: '其他联赛（参考）', hint: '欧冠 / 英超等，仅作对比参考' },
]

/** 从 match_date 提取年份 */
function getYear(m: Match): number {
  return m.match_date ? new Date(m.match_date).getFullYear() : 0
}

/** 世界杯届次名称 */
const WC_EDITION: Record<number, string> = {
  2022: '2022 卡塔尔世界杯',
  2018: '2018 俄罗斯世界杯',
  2014: '2014 巴西世界杯',
  2010: '2010 南非世界杯',
  2006: '2006 德国世界杯',
  2002: '2002 韩日世界杯',
  1998: '1998 法国世界杯',
}


function TierMatchList({ tier }: { tier: Tier | Tier[] }) {
  const { matches, loading, error } = useMatches({ tier, status: 'finished', limit: 500 })

  // Group by year, sorted newest first
  const groups = useMemo(() => {
    const map = new Map<number, Match[]>()
    for (const m of matches) {
      const y = getYear(m)
      if (!map.has(y)) map.set(y, [])
      map.get(y)!.push(m)
    }
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0])
  }, [matches])

  if (loading) return <LoadingSpinner />
  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        加载失败：{error}
      </div>
    )
  }
  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          暂无数据，请先运行同步函数拉取历史赛程。
        </CardContent>
      </Card>
    )
  }

  // For tier 2 (historical WC), group by year with section headers
  if (!Array.isArray(tier) && tier === 2) {
    return (
      <div className="space-y-8">
        {groups.map(([year, ms]) => (
          <section key={year} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold">{WC_EDITION[year] ?? `${year} 世界杯`}</h2>
              <Badge variant="finished" className="text-[10px]">{ms.length} 场</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ms.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  showTier={false}
                  wcYear={year}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    )
  }

  // For other tiers, flat list
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} showTier />
      ))}
    </div>
  )
}

export function HistoryPage() {
  const [tab, setTab] = useState('historical')

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wc-blue/10">
          <History className="h-5 w-5 text-wc-blue-light" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">历届数据参考</h1>
          <p className="text-sm text-muted-foreground">
            数据优先级：2026 世界杯 &gt; 历届世界杯 &gt; 其他联赛
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TIER_TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {TIER_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <p className="mb-4 text-sm text-muted-foreground">{t.hint}</p>
            <TierMatchList tier={t.tier} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
