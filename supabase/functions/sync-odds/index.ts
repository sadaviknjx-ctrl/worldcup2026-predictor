// Supabase Edge Function — fetches FIFA World Cup 2026 odds from The Odds API
// and upserts consensus odds into match_odds table.
//
// Deploy: supabase functions deploy sync-odds
// Secret: ODDS_API_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2'

const ODDS_API_KEY   = Deno.env.get('ODDS_API_KEY')!
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase       = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Team name → our DB team ID mapping ──────────────────────────────────────
const TEAM_NAME_MAP: Record<string, number> = {
  // 2022 WC teams (real API-Football IDs)
  'belgium': 1, 'france': 2, 'croatia': 3, 'brazil': 6, 'uruguay': 7,
  'spain': 9, 'england': 10, 'japan': 12, 'senegal': 13, 'serbia': 14,
  'switzerland': 15, 'mexico': 16, 'south korea': 17, 'korea republic': 17,
  'australia': 20, 'denmark': 21, 'iran': 22, 'saudi arabia': 23,
  'poland': 24, 'germany': 25, 'argentina': 26, 'portugal': 27,
  'tunisia': 28, 'costa rica': 29, 'morocco': 31, 'netherlands': 1118,
  'ghana': 1504, 'cameroon': 1530, 'qatar': 1569,
  'ecuador': 2382, 'usa': 2384, 'united states': 2384, 'canada': 5529,
  'wales': 767,
  // 2026 new teams (synthetic IDs)
  'south africa': 9000001, 'czechia': 9000002, 'czech republic': 9000002,
  'bosnia and herzegovina': 9000003, 'bosnia herzegovina': 9000003,
  'haiti': 9000004, 'scotland': 9000005, 'paraguay': 9000006,
  'turkey': 9000007, 'türkiye': 9000007,
  'curaçao': 9000008, 'curacao': 9000008, 'curaao': 9000008,
  "ivory coast": 9000009, "cote d'ivoire": 9000009, 'côte d\'ivoire': 9000009,
  'sweden': 9000010, 'new zealand': 9000011, 'cape verde': 9000012,
  'iraq': 9000013, 'norway': 9000014, 'algeria': 9000015,
  'austria': 9000016, 'jordan': 9000017, 'uzbekistan': 9000018,
  'colombia': 9000019, 'dr congo': 9000020, 'congo dr': 9000020,
  'democratic republic of congo': 9000020,
  'panama': 9000021, 'egypt': 9000022,
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
}

function resolveTeamId(name: string): number | null {
  const n = normalize(name)
  return TEAM_NAME_MAP[n] ?? null
}

interface OddsEvent {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: {
    key: string
    markets: {
      key: string
      outcomes: { name: string; price: number }[]
    }[]
  }[]
}

async function fetchOdds(sportKey: string): Promise<OddsEvent[]> {
  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`)
  url.searchParams.set('apiKey', ODDS_API_KEY)
  url.searchParams.set('regions', 'eu')
  url.searchParams.set('markets', 'h2h')
  url.searchParams.set('oddsFormat', 'decimal')
  const res = await fetch(url.toString())
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Odds API ${sportKey} → ${res.status}: ${txt}`)
  }
  return res.json()
}

async function findSportKey(): Promise<string | null> {
  const url = `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) return null
  const sports: { key: string; title: string; active: boolean }[] = await res.json()
  // Find FIFA World Cup entry
  const wc = sports.find(s =>
    s.key.includes('world_cup') ||
    s.title.toLowerCase().includes('world cup')
  )
  return wc?.key ?? null
}

Deno.serve(async () => {
  try {
    // 1. Find the correct sport key for FIFA World Cup 2026
    let sportKey = await findSportKey()
    if (!sportKey) {
      // Fallback: try common key directly
      sportKey = 'soccer_fifa_world_cup'
    }

    // 2. Fetch odds events
    let events: OddsEvent[] = []
    try {
      events = await fetchOdds(sportKey)
    } catch (e) {
      // If the specific key fails, try listing all soccer sports and find it
      return new Response(
        JSON.stringify({ ok: false, error: String(e), sportKey }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, synced: 0, message: 'No events found — odds may not yet be published for upcoming matches', sportKey }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. Load our upcoming 2026 WC matches for matching
    const { data: upcoming } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)')
      .eq('tier', 1)
      .eq('status', 'upcoming')

    // Build lookup: home_id|away_id → match_id
    const matchLookup = new Map<string, number>()
    for (const m of (upcoming ?? []) as any[]) {
      matchLookup.set(`${m.home_team_id}|${m.away_team_id}`, m.id)
      matchLookup.set(`${m.away_team_id}|${m.home_team_id}`, m.id) // reversed lookup too
    }

    let synced = 0
    const skipped: string[] = []

    for (const event of events) {
      const homeId = resolveTeamId(event.home_team)
      const awayId = resolveTeamId(event.away_team)

      if (!homeId || !awayId) {
        skipped.push(`${event.home_team} vs ${event.away_team} (unresolved team)`)
        continue
      }

      const matchId = matchLookup.get(`${homeId}|${awayId}`)
      if (!matchId) {
        skipped.push(`${event.home_team} vs ${event.away_team} (no DB match found)`)
        continue
      }

      // Average odds across all bookmakers
      const h2hMarkets = event.bookmakers
        .flatMap(b => b.markets.filter(m => m.key === 'h2h'))

      if (h2hMarkets.length === 0) continue

      let homeSum = 0, drawSum = 0, awaySum = 0, count = 0
      for (const market of h2hMarkets) {
        const home = market.outcomes.find(o => normalize(o.name) === normalize(event.home_team))
        const draw = market.outcomes.find(o => o.name === 'Draw')
        const away = market.outcomes.find(o => normalize(o.name) === normalize(event.away_team))
        if (home && draw && away) {
          homeSum += home.price
          drawSum += draw.price
          awaySum += away.price
          count++
        }
      }
      if (count === 0) continue

      await supabase.from('match_odds').upsert({
        match_id: matchId,
        home_odds: +(homeSum / count).toFixed(3),
        draw_odds: +(drawSum / count).toFixed(3),
        away_odds: +(awaySum / count).toFixed(3),
        bookmaker_count: count,
        fetched_at: new Date().toISOString(),
      }, { onConflict: 'match_id' })

      synced++
    }

    return new Response(
      JSON.stringify({ ok: true, synced, skipped, sportKey, totalEvents: events.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
