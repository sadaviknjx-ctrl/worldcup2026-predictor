import { Target, Award, TrendingUp, Medal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchCard } from '@/components/shared/MatchCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useMatches } from '@/hooks/useMatches'
import { usePredictions } from '@/hooks/usePredictions'

export function MyStatsPage() {
  const { predictions, loading: loadingPredictions, stats } = usePredictions()
  const { matches, loading: loadingMatches } = useMatches({ tier: 1, limit: 100 })

  const loading = loadingPredictions || loadingMatches
  const accuracy = stats.scored > 0 ? Math.round((stats.resultHits + stats.exactHits) / stats.scored * 100) : 0

  const predictedMatches = matches.filter((m) => predictions.some((p) => p.match_id === m.id))
  const byMatchId = (id: number) => predictions.find((p) => p.match_id === id)

  const STAT_CARDS = [
    { icon: Target, label: '总预测场次', value: stats.total, color: 'text-wc-blue-light', bg: 'bg-wc-blue/10' },
    { icon: Award, label: '累计积分', value: stats.totalPoints, color: 'text-wc-yellow', bg: 'bg-wc-yellow/10' },
    { icon: Medal, label: '精确命中', value: stats.exactHits, color: 'text-green-400', bg: 'bg-green-500/10' },
    { icon: TrendingUp, label: '命中率', value: `${accuracy}%`, color: 'text-wc-red', bg: 'bg-wc-red/10' },
  ]

  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-wc-yellow/10">
          <Target className="h-5 w-5 text-wc-yellow" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">我的竞猜统计</h1>
          <p className="text-sm text-muted-foreground">个人预测记录与命中情况</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5 text-center space-y-2">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Scoring rules */}
      <Card className="border-wc-blue/20 bg-wc-blue/5">
        <CardContent className="flex items-start gap-3 p-4">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-wc-blue-light" />
          <div className="text-sm">
            <p className="font-semibold">计分规则</p>
            <p className="mt-1 text-muted-foreground">
              猜中比赛结果（胜/平/负）得 <span className="text-foreground font-medium">1 分</span>；
              猜中精确比分得 <span className="text-wc-yellow font-medium">3 分</span>。
              比赛结束后系统自动计分。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* My predictions list */}
      <section className="space-y-4">
        <CardHeader className="px-0 pb-0">
          <CardTitle className="text-lg">预测记录</CardTitle>
        </CardHeader>

        {loading ? (
          <LoadingSpinner />
        ) : predictedMatches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              还没有预测记录。前往「2026 赛程」页面参与预测吧！
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {predictedMatches.map((m) => (
              <MatchCard key={m.id} match={m} prediction={byMatchId(m.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
