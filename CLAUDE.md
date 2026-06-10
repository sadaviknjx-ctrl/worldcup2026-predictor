# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Type-check + Vite production build
npm run preview      # Preview production build locally
npm run lint         # ESLint (zero warnings allowed)
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier (also sorts Tailwind classes)
npm run type-check   # tsc --noEmit
```

## What this is

A **personal-use** data dashboard and prediction log for the 2026 World Cup — not a public product. There is no auth, no multi-user leaderboard, no registration. Single visitor, direct access.

## Architecture

**Stack:** React 18 + TypeScript + Vite 5, Tailwind CSS v3, React Router v6, Supabase JS v2 (Postgres + Edge Functions), API-Football (via RapidAPI) as the upstream data source.

**Path alias:** `@/` maps to `src/`. Use it everywhere instead of relative imports.

**Entry:** `src/main.tsx` → `src/App.tsx` (router) → `src/components/layout/RootLayout.tsx` (Navbar + Footer wrapping an `<Outlet>`).

### Data priority — the central design constraint

Every data-bearing table carries a `tier` column that drives sort order and which UI surfaces show it:

```
Tier 1 ★★★  WC_2026         — 2026 World Cup (always shown first / by default)
Tier 2 ★★   WC_HISTORICAL   — Historical World Cups (1998–2022)
Tier 3 ★    OTHER           — Other leagues (Champions League, Premier League…) — reference only
```

`useMatches({ tier })` accepts a single tier or an array and orders `tier asc, match_date asc`, so Tier 1 always sorts ahead regardless of date. `TierBadge` renders the star-rated badge consistently across pages.

### Routes / pages

| Route | Page | Purpose |
|---|---|---|
| `/` | `HomePage` | 2026 schedule (Tier 1), personal prediction stat strip, inline score-prediction inputs |
| `/history` | `HistoryPage` | Tabs over Tier 2 (historical World Cups) and Tier 3 (other leagues, reference) |
| `/players` | `PlayersPage` | **Player-level** win-rate leaderboard — the headline feature |
| `/my-stats` | `MyStatsPage` | Personal prediction accuracy summary + list of predicted matches |

### Directory conventions

| Path | Purpose |
|------|---------|
| `src/components/ui/` | shadcn-style primitives (Button, Card, Badge, Input, Tabs, Separator, Label, Toast) |
| `src/components/layout/` | Navbar, Footer, RootLayout (no auth-dependent UI) |
| `src/components/shared/` | MatchCard (handles display + inline prediction editing), TierBadge, ErrorBoundary, LoadingSpinner |
| `src/pages/` | One file per route, named `*Page.tsx` |
| `src/hooks/` | `useMatches`, `usePlayerWinRates`, `usePredictions`, `useToast` — all Supabase-backed |
| `src/lib/supabase.ts` | Supabase client singleton (reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) |
| `src/lib/utils.ts` | `cn()`, date helpers (`date-fns`), `getStageLabel`, `calcPredictionPoints` |
| `src/types/index.ts` | Shared types: `Tier`, `Competition`, `Team`, `Player`, `Match`, `MatchLineup`, `PlayerWinRate`, `Prediction` |
| `src/styles/globals.css` | Tailwind directives + CSS variable theme + utility classes |
| `supabase/migrations/0001_init.sql` | Full schema: competitions/seasons/teams/players/matches/match_lineups/predictions/sync_log + the `player_win_rates` view + RLS policies |
| `supabase/functions/sync-football-data/` | Edge Function that pulls fixtures + per-match player stats from API-Football and upserts them, tier-aware |

### Theming

Dark theme only (set via `class="dark"` on `<html>` in `index.html`). CSS variables live in `src/styles/globals.css` under `:root`. World Cup brand colours are exposed as Tailwind tokens: `wc-blue: #00529B`, `wc-red: #E30613`, `wc-yellow: #FFD100`. Custom utilities: `.wc-gradient`, `.wc-gradient-hero`, `.wc-text-gradient`, `.skeleton`, `.glass`.

### Supabase setup

1. Run `supabase/migrations/0001_init.sql` against your project (creates tables, the `player_win_rates` view, and RLS policies — reads are public, `predictions` allows anon writes since this is single-user).
2. Deploy the Edge Function: `supabase functions deploy sync-football-data`, then set secrets `RAPIDAPI_KEY`, `RAPIDAPI_HOST`, plus the project's own `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`.
3. Schedule it with `pg_cron` (SQL snippet at the bottom of `index.ts`) or trigger manually via the "刷新数据" button on the home page.
4. `.env.local` (gitignored) holds `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for the frontend, plus `RAPIDAPI_KEY`/`RAPIDAPI_HOST` for reference (the function reads these from Supabase secrets, not from this file).

### Data layer pattern

Hooks in `src/hooks/` query Supabase directly and return `{ data, loading, error, refetch }`. `usePlayerWinRates` additionally collapses the per-tier/per-starter rows from the `player_win_rates` view into one aggregate per player and computes a `winRate` percentage — this is where the "颗粒度到球员个人" requirement is implemented. Pages render `<LoadingSpinner />` while loading and an inline error banner on failure; `<ErrorBoundary>` (in `RootLayout`) catches render-time exceptions.

### Scoring rules

`calcPredictionPoints` in `src/lib/utils.ts`: exact score → 3 pts; correct result only → 1 pt; otherwise 0. The same rule is encoded in `predictions.points_earned`, expected to be filled in by a future "settle finished matches" job (not yet implemented — currently null until manually/automatically scored).
