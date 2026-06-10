import { Link } from 'react-router-dom'
import { Frown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <Frown className="h-16 w-16 text-muted-foreground" />
      <div>
        <h1 className="text-5xl font-extrabold text-wc-yellow">404</h1>
        <p className="mt-2 text-lg font-semibold">页面不存在</p>
        <p className="mt-1 text-sm text-muted-foreground">这个球出界了…找不到你要的页面</p>
      </div>
      <Button variant="wc" asChild>
        <Link to="/">返回首页</Link>
      </Button>
    </div>
  )
}
