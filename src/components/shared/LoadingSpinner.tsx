import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  fullScreen?: boolean
}

export function LoadingSpinner({ size = 'md', className, fullScreen }: LoadingSpinnerProps) {
  const sizeClass = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' }[size]

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-border border-t-wc-blue',
        sizeClass,
        className,
      )}
    />
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-muted-foreground">加载中…</p>
        </div>
      </div>
    )
  }

  return spinner
}
