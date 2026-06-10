import { useState, useMemo } from 'react'
import { Trophy, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MatchCard } from '@/components/shared/MatchCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'
import { usePredictionEngine } from '@/hooks/usePredictionEngine'
import { useMatchOdds } from '@/hooks/useMatchOdds'
import { type Match } from '@/types'

const STATS = [
  { value: '48', label: '参赛球队' },
  { value: '104', label: '总场次' },
  { value: '16', label: '比赛场馆' },
  { value: '3', label: '举办国' },
]

/** 从 round 字符串提取轮次 key，用于分组 */
function getRoundKey(round: string | null | undefined): string {
  if (!round) return '其他'
  // "Group A - Matchday 1" → "Matchday 1"
  // "Group Stage - Matchday 2" → "Matchday 2"
  const md = round.match(/Matchday\s*(\d+)/i)
  if (md) return `小组赛 第${md[1]}轮`
  if (/round of 16/i.test(round)) return '淘汰赛 · 十六强'
  if (/quarter/i.test(round)) return '淘汰赛 · 四分之一决赛'
  if (/semi/i.test(round)) return '淘汰赛 · 半决赛'
  if (/final/i.test(round)) return '决赛'
  return round
}

function getRoundOrder(key: string): number {
  if (key.includes('第1轮')) return 1
  if (key.includes('第2轮')) return 2
  if (key.includes('第3轮')) return 3
  if (key.includes('十六强')) return 10
  if (key.includes('四分之一')) return 11
  if (key.includes('半决赛')) return 12
  if (key.includes('决赛')) return 13
  return 99
}

/** 分组后每组的排序：按 home_team 名字 */
function sortMatchesInGroup(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const nameA = a.home_team?.name_zh ?? a.home_team?.name ?? ''
    const nameB = b.home_team?.name_zh ?? b.home_team?.name ?? ''
    // 先按日期，再按队名
    const dateA = a.match_date ?? ''
    const dateB = b.match_date ?? ''
    return dateA < dateB ? -1 : dateA > dateB ? 1 : nameA.localeCompare(nameB)
  })
}

interface RoundSection {
  key: string
  order: number
  matches: Match[]
  hasUpcoming: boolean
}

export function HomePage() {
  const { matches: tier1Matches, loading: loading1, error: error1, refetch } = useMatches({ tier: 1, limit: 200 })
  const { matches: tier2Matches, loading: loading2, refetch: refetch2 } = useMatches({ tier: 2, limit: 200 })

  const hasTier1 = tier1Matches.length > 0
  const matches = hasTier1 ? tier1Matches : tier2Matches
  const loading = loading1 || loading2
  const error = error1

  const { byMatchId, upsertPrediction, stats } = usePredictions()
  const { predict, finishedWC2026Count, weights } = usePredictionEngine()

  // Bulk-fetch odds for all tier-1 upcoming matches
  const upcomingIds = useMemo(
    () => tier1Matches.filter(m => m.status === 'upcoming').map(m => m.id),
    [tier1Matches]
  )
  const { odds: oddsMap } = useMatchOdds(upcomingIds)

  // 按轮次分组
  const sections: RoundSection[] = useMemo(() => {
    const map = new Map<string, Match[]>()
    for (const m of matches) {
      const key = getRoundKey(m.round)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return Array.from(map.entries())
      .map(([key, ms]) => ({
        key,
        order: getRoundOrder(key),
        matches: sortMatchesInGroup(ms),
        hasUpcoming: ms.some((m) => m.status !== 'finished'),
      }))
      .sort((a, b) => a.order - b.order)
  }, [matches])

  // 默认展开：含即将开赛场次的第一个轮次（或第一个轮次）
  const defaultOpen = useMemo(() => {
    const first = sections.find((s) => s.hasUpcoming) ?? sections[0]
    return first?.key ?? ''
  }, [sections])

  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  // 用 ref trick：第一次渲染后根据 defaultOpen 初始化 openSections
  const effectiveOpen = useMemo(() => {
    if (openSections.size === 0 && defaultOpen) return new Set([defaultOpen])
    return openSections
  }, [openSections, defaultOpen])

  const toggle = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev.size === 0 ? [defaultOpen] : prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const finishedTotal = matches.filter((m) => m.status === 'finished').length
  const upcomingTotal = matches.filter((m) => m.status !== 'finished').length

  return (
    <div className="container space-y-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wc-yellow/10">
            <Trophy className="h-5 w-5 text-wc-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {hasTier1 ? '2026 美加墨世界杯' : '世界杯历届赛程'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasTier1
                ? '赛程数据 · 个人竞猜看板'
                : '2026 赛程数据同步中 · 当前显示 2022 卡塔尔世界杯'}
            </p>
          </div>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => { refetch(); refetch2() }}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map(({ value, label }) => (
          <Card key={label} className="text-center">
            <CardContent className="p-4">
              <p className="text-2xl font-extrabold text-wc-yellow">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
        {/* 我的竞猜成绩 */}
        <Card className="col-span-2 sm:col-span-4 border-wc-blue/30 bg-wc-blue/5">
          <CardContent className="flex flex-wrap items-center justify-around gap-4 p-4">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{matches.length}</p>
              <p className="text-xs text-muted-foreground">总场次</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-xl font-bold text-wc-yellow">{upcomingTotal}</p>
              <p className="text-xs text-muted-foreground">待开赛</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-xl font-bold text-green-400">{finishedTotal}</p>
              <p className="text-xs text-muted-foreground">已结束</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">已预测</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="text-center">
              <p className="text-xl font-bold text-wc-yellow">{stats.totalPoints}</p>
              <p className="text-xs text-muted-foreground">累计得分</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 算法权重指示器 */}
      <Card className="border-wc-blue/20 bg-wc-blue/5">
        <CardContent className="flex flex-wrap items-center gap-x-5 gap-y-1 p-3 text-xs">
          <span className="font-semibold text-wc-blue">算法权重</span>
          <span className="text-muted-foreground">
            本届&nbsp;<span className="font-bold text-wc-yellow">{Math.round(weights.wc2026 * 100)}%</span>
          </span>
          <span className="text-muted-foreground">
            2022&nbsp;<span className="font-bold text-foreground">{Math.round(weights.wc2022 * 100)}%</span>
          </span>
          <span className="text-muted-foreground">
            2018&nbsp;<span className="font-bold text-foreground">{Math.round(weights.wc2018 * 100)}%</span>
          </span>
          <span className="ml-auto text-muted-foreground">
            {finishedWC2026Count === 0
              ? '开赛后本届权重将自动提升'
              : `本届已完赛 ${finishedWC2026Count} 场，权重持续更新中`}
          </span>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          数据加载失败：{error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            暂无赛程数据。请点击右上角「刷新数据」或手动触发
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5">sync-football-data</code>
            同步函数。
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => {
            const isOpen = effectiveOpen.has(section.key)
            return (
              <div key={section.key} className="rounded-xl border border-border overflow-hidden">
                {/* Section header — clickable */}
                <button
                  onClick={() => toggle(section.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <span className="font-semibold text-sm">{section.key}</span>
                    <Badge variant={section.hasUpcoming ? 'upcoming' : 'finished'} className="text-[10px]">
                      {section.matches.length} 场
                    </Badge>
                    {section.hasUpcoming && (
                      <span className="text-[10px] text-wc-yellow font-medium">
                        {section.matches.filter(m => m.status !== 'finished').length} 场待赛
                      </span>
                    )}
                  </div>
                  {!section.hasUpcoming && (
                    <span className="text-xs text-muted-foreground">已全部完赛</span>
                  )}
                </button>

                {/* Collapsible match grid */}
                {isOpen && (
                  <div className="p-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {section.matches.map((match) => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          prediction={byMatchId(match.id)}
                          algoPrediction={predict(match.home_team_id, match.away_team_id)}
                          matchOdds={oddsMap[match.id]}
                          onSavePrediction={
                            match.status === 'upcoming'
                              ? async (id, h, a) => { await upsertPrediction(id, h, a) }
                              : undefined
                          }
                          hideRound
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
