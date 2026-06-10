import { Trophy } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50">
      <div className="container py-5">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5 text-wc-yellow" />
          <span>WorldCup 2026 Predictor · 个人数据看板 · 数据来自 API-Football</span>
        </div>
      </div>
    </footer>
  )
}
