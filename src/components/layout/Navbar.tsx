import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/', label: '2026 赛程' },
  { to: '/history', label: '历届数据' },
  { to: '/players', label: '球员胜率' },
  { to: '/my-stats', label: '我的竞猜' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wc-blue shadow-lg shadow-wc-blue/30">
            <Trophy className="h-4 w-4 text-wc-yellow" />
          </div>
          <span className="hidden text-sm sm:block">
            <span className="text-white">WorldCup</span>
            <span className="text-wc-yellow"> 2026</span>
            <span className="ml-1 text-muted-foreground font-normal">Predictor</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-wc-blue/15 text-white'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Mobile menu button */}
        <button
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="space-y-1">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-wc-blue/15 text-white'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
