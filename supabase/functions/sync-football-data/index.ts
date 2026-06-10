// Supabase Edge Function — pulls fixtures, lineups & player stats from API-Football
// and upserts them into our tables, respecting the Tier 1/2/3 priority.
//
// Deploy:  supabase functions deploy sync-football-data
// Secrets: supabase secrets set APIFOOTBALL_KEY=... APIFOOTBALL_HOST=v3.football.api-sports.io
// Schedule: supabase cron / pg_cron — see bottom of file for SQL snippet.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const APIFOOTBALL_KEY = Deno.env.get('APIFOOTBALL_KEY')!
const APIFOOTBALL_HOST = Deno.env.get('APIFOOTBALL_HOST') ?? 'v3.football.api-sports.io'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const API_BASE = `https://${APIFOOTBALL_HOST}`

// Free-tier API-Football plans allow ~10 requests/minute. Throttle + cap calls per run
// so we never trip the rate limiter, and so a single invocation finishes within the
// Edge Function time budget. Re-run the function (e.g. via the "刷新数据" button or cron)
// to incrementally sync more — sync_log records progress.
const REQUEST_INTERVAL_MS = 7000
const MAX_REQUESTS_PER_RUN = 10
let requestCount = 0
let lastRequestAt = 0

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function apiFootball<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (requestCount >= MAX_REQUESTS_PER_RUN) {
    throw new Error('QUOTA_GUARD: reached max requests for this run — re-run to continue syncing')
  }
  const elapsed = Date.now() - lastRequestAt
  if (lastRequestAt > 0 && elapsed < REQUEST_INTERVAL_MS) {
    await sleep(REQUEST_INTERVAL_MS - elapsed)
  }
  lastRequestAt = Date.now()
  requestCount++

  const qs = new URLSearchParams(params as Record<string, string>).toString()
  const res = await fetch(`${API_BASE}/${path}${qs ? `?${qs}` : ''}`, {
    headers: {
      'x-apisports-key': APIFOOTBALL_KEY,
    },
  })
  if (!res.ok) throw new Error(`API-Football ${path} → ${res.status} ${await res.text()}`)
  const json = await res.json()
  // api-sports.io returns 200 even when quota is exhausted — detect via errors field
  if (json.errors && Object.keys(json.errors).length > 0) {
    const errMsg = JSON.stringify(json.errors)
    if (errMsg.includes('limit') || errMsg.includes('subscription') || errMsg.includes('requests')) {
      throw new Error(`QUOTA_GUARD: API quota exhausted — ${errMsg}`)
    }
    throw new Error(`API-Football ${path} error: ${errMsg}`)
  }
  return json.response as T
}

// ─── Tiered competition list ─────────────────────────────────────────────────
// World Cup league id in API-Football is 1.
// API-Football free plan restriction: seasons 2022–2024 only.
// - WC 2026 fixtures are manually seeded in DB; API won't have them on free plan yet.
// - WC historical: only 2022 is available on free plan (2018 and earlier blocked).
// - UCL/PL: use 2023 (latest available on free plan).
const COMPETITIONS: { id: number; name: string; type: 'WC_2026' | 'WC_HISTORICAL' | 'OTHER'; tier: 1 | 2 | 3; seasons: number[] }[] = [
  // WC 2026 fixtures already seeded via SQL migration — skip API sync (season 2026 blocked on free plan)
  // { id: 1, name: 'FIFA World Cup 2026', type: 'WC_2026', tier: 1, seasons: [2026] },
  {
    id: 1,
    name: 'FIFA World Cup (Historical)',
    type: 'WC_HISTORICAL',
    tier: 2,
    seasons: [2022], // Free plan: only 2022–2024 available; 2018 and earlier are blocked
  },
  { id: 2, name: 'UEFA Champions League', type: 'OTHER', tier: 3, seasons: [2023] },
  { id: 39, name: 'Premier League', type: 'OTHER', tier: 3, seasons: [2023] },
]

async function logRun(scope: string, status: 'success' | 'error', detail?: string) {
  await supabase.from('sync_log').insert({ source: 'api-football', scope, status, detail })
}

async function upsertCompetitionsAndSeasons() {
  for (const c of COMPETITIONS) {
    await supabase.from('competitions').upsert({
      id: c.id,
      name: c.name,
      type: c.type,
      tier: c.tier,
    }, { onConflict: 'id' })

    for (const year of c.seasons) {
      await supabase.from('seasons').upsert(
        { competition_id: c.id, year },
        { onConflict: 'competition_id,year' },
      )
    }
  }
}

interface Fixture {
  fixture: { id: number; date: string; venue: { name: string; city: string }; status: { short: string } }
  league: { id: number; season: number }
  teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string } }
  goals: { home: number | null; away: number | null }
}

function mapStatus(short: string): 'upcoming' | 'live' | 'finished' {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished'
  if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(short)) return 'live'
  return 'upcoming'
}

async function upsertTeam(t: { id: number; name: string; logo: string }) {
  await supabase.from('teams').upsert(
    { id: t.id, name: t.name, logo_url: t.logo },
    { onConflict: 'id', ignoreDuplicates: false },
  )
}

async function syncFixturesForSeason(competitionId: number, leagueId: number, season: number, tier: 1 | 2 | 3) {
  const fixtures = await apiFootball<Fixture[]>('fixtures', { league: leagueId, season })

  for (const f of fixtures) {
    await upsertTeam(f.teams.home)
    await upsertTeam(f.teams.away)

    await supabase.from('matches').upsert({
      id: f.fixture.id,
      competition_id: competitionId,
      tier,
      home_team_id: f.teams.home.id,
      away_team_id: f.teams.away.id,
      home_score: f.goals.home,
      away_score: f.goals.away,
      match_date: f.fixture.date,
      venue: f.fixture.venue?.name ?? null,
      venue_city: f.fixture.venue?.city ?? null,
      status: mapStatus(f.fixture.status.short),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  return fixtures.length
}

interface LineupPlayerStats {
  player: { id: number; name: string; photo: string }
  statistics: [{
    games: { minutes: number | null; rating: string | null; substitute: boolean }
    goals: { total: number | null; assists: number | null }
    cards: { yellow: number; red: number }
  }]
}

async function syncPlayerStatsForFixture(fixtureId: number, homeTeamId: number, awayTeamId: number) {
  const data = await apiFootball<{ team: { id: number }; players: LineupPlayerStats[] }[]>(
    'fixtures/players',
    { fixture: fixtureId },
  )

  for (const teamBlock of data) {
    const teamId = teamBlock.team.id
    if (teamId !== homeTeamId && teamId !== awayTeamId) continue

    for (const p of teamBlock.players) {
      const stat = p.statistics?.[0]
      if (!stat) continue

      await supabase.from('players').upsert({
        id: p.player.id,
        name: p.player.name,
        photo_url: p.player.photo,
      }, { onConflict: 'id' })

      await supabase.from('match_lineups').upsert({
        match_id: fixtureId,
        player_id: p.player.id,
        team_id: teamId,
        is_starter: stat.games.substitute === false,
        minutes_played: stat.games.minutes,
        goals: stat.goals.total ?? 0,
        assists: stat.goals.assists ?? 0,
        rating: stat.games.rating ? Number(stat.games.rating) : null,
        yellow_cards: stat.cards.yellow,
        red_cards: stat.cards.red,
      }, { onConflict: 'match_id,player_id' })
    }
  }
}

Deno.serve(async (req) => {
  try {
    const { scope = 'all' } = await req.json().catch(() => ({}))

    await upsertCompetitionsAndSeasons()

    let fixturesSynced = 0
    let quotaHit = false
    if (scope === 'all' || scope === 'fixtures') {
      outer: for (const c of COMPETITIONS) {
        for (const season of c.seasons) {
          try {
            fixturesSynced += await syncFixturesForSeason(c.id, c.id, season, c.tier)
          } catch (e) {
            const msg = String(e)
            if (msg.startsWith('Error: QUOTA_GUARD')) { quotaHit = true; break outer }
            // Free plan blocks certain seasons — skip gracefully instead of crashing
            if (msg.includes('Free plans do not have access') || msg.includes('plan')) {
              console.warn(`Skipping ${c.name} season ${season}: ${msg}`)
              continue
            }
            throw e
          }
        }
      }
      await logRun('fixtures', 'success', `${fixturesSynced} fixtures upserted${quotaHit ? ' (quota guard hit — re-run to continue)' : ''}`)
    }

    // Player-level stats: only for finished Tier 1/2 matches (keeps API quota sane)
    let lineupsSynced = 0
    if (!quotaHit && (scope === 'all' || scope === 'lineups')) {
      const { data: alreadySynced } = await supabase
        .from('match_lineups')
        .select('match_id')
      const syncedIds = new Set((alreadySynced ?? []).map((r) => r.match_id))

      const { data: candidateMatches } = await supabase
        .from('matches')
        .select('id, home_team_id, away_team_id')
        .in('tier', [1, 2])
        .eq('status', 'finished')
        .limit(200)

      const targetMatches = (candidateMatches ?? []).filter((m) => !syncedIds.has(m.id)).slice(0, 50)

      for (const m of targetMatches) {
        try {
          await syncPlayerStatsForFixture(m.id, m.home_team_id, m.away_team_id)
          lineupsSynced++
        } catch (e) {
          if (String(e).startsWith('Error: QUOTA_GUARD')) { quotaHit = true; break }
          throw e
        }
      }
      await logRun('lineups', 'success', `${lineupsSynced} matches' lineups synced${quotaHit ? ' (quota guard hit — re-run to continue)' : ''}`)
    }

    return new Response(
      JSON.stringify({ ok: true, fixturesSynced, lineupsSynced, quotaHit }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    await logRun('all', 'error', String(err))
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

/* ── Schedule via pg_cron (run once in the SQL editor) ──────────────────────
select cron.schedule(
  'sync-football-data-nightly',
  '0 2 * * *',  -- every day at 02:00
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/sync-football-data',
    headers := '{"Authorization": "Bearer <service-role-or-anon-key>", "Content-Type": "application/json"}'::jsonb,
    body := '{"scope": "all"}'::jsonb
  );
  $$
);
*/
