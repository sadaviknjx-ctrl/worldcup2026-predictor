import { createClient } from 'jsr:@supabase/supabase-js@2'

const FOOTBALL_DATA_KEY = Deno.env.get('FOOTBALL_DATA_KEY')!
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase          = createClient(SUPABASE_URL, SERVICE_KEY)

const TEAM_MAP: Record<string, number> = {
  'mexico': 16, 'south korea': 17, 'korea republic': 17,
  'canada': 5529, 'france': 2, 'belgium': 1, 'croatia': 3,
  'brazil': 6, 'uruguay': 7, 'spain': 9, 'england': 10,
  'japan': 12, 'senegal': 13, 'serbia': 14, 'switzerland': 15,
  'south africa': 9000001, 'czechia': 9000002, 'czech republic': 9000002,
  'bosnia-herzegovina': 9000003, 'bosnia herzegovina': 9000003,
  'bosniaherzegovina': 9000003,
  'haiti': 9000004, 'scotland': 9000005, 'paraguay': 9000006,
  'turkey': 9000007, 'turkiye': 9000007,
  'curacao': 9000008, 'ivory coast': 9000009, 'cote divoire': 9000009,
  'sweden': 9000010,
  'cape verde': 9000012, 'cape verde islands': 9000012,
  'iraq': 9000013, 'norway': 9000014, 'algeria': 9000015,
  'austria': 9000016, 'jordan': 9000017, 'uzbekistan': 9000018,
  'colombia': 9000019,
  'dr congo': 9000020, 'congo dr': 9000020,
  'democratic republic of congo': 9000020,
  'democratic republic congo': 9000020,
  'panama': 9000021, 'egypt': 9000022,
  'new zealand': 9000011,
  'australia': 20, 'denmark': 21, 'iran': 22, 'saudi arabia': 23,
  'poland': 24, 'germany': 25, 'argentina': 26, 'portugal': 27,
  'tunisia': 28, 'costa rica': 29, 'morocco': 31,
  'netherlands': 1118, 'ghana': 1504, 'cameroon': 1530,
  'qatar': 1569, 'ecuador': 2382, 'usa': 2384, 'united states': 2384,
  'wales': 767,
}

function normalize(name: string): string {
  // Decompose unicode (ç→c, é→e, etc.) then strip non-ascii
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function resolveTeamId(name: string): number | null {
  return TEAM_MAP[normalize(name)] ?? null
}

Deno.serve(async () => {
  try {
    // 1. 拉 football-data.org 已完赛结果
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?season=2026&status=FINISHED',
      { headers: { 'X-Auth-Token': FOOTBALL_DATA_KEY } }
    )
    if (!res.ok) throw new Error(`football-data.org: ${res.status}`)
    const json = await res.json()
    const finishedMatches = json.matches ?? []

    // 2. 加载DB里所有tier=1比赛
    const { data: dbMatches } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, status, home_score, away_score')
      .eq('tier', 1)
      .limit(200)

    const lookup = new Map<string, typeof dbMatches[0]>()
    for (const m of (dbMatches ?? [])) {
      lookup.set(`${m.home_team_id}|${m.away_team_id}`, m)
    }

    // 3. 逐场比对并更新
    let updated = 0
    const skipped: string[] = []

    for (const m of finishedMatches) {
      const homeId = resolveTeamId(m.homeTeam.name)
      const awayId = resolveTeamId(m.awayTeam.name)
      const score  = m.score.fullTime

      if (!homeId || !awayId) {
        skipped.push(`${m.homeTeam.name} vs ${m.awayTeam.name} (unresolved)`)
        continue
      }

      const dbM = lookup.get(`${homeId}|${awayId}`)
      if (!dbM) {
        skipped.push(`${m.homeTeam.name} vs ${m.awayTeam.name} (no DB match)`)
        continue
      }

      // 已是正确结果则跳过
      if (dbM.status === 'finished' && dbM.home_score === score.home && dbM.away_score === score.away) {
        continue
      }

      await supabase.from('matches').update({
        status: 'finished',
        home_score: score.home,
        away_score: score.away,
      }).eq('id', dbM.id)

      updated++
    }

    return new Response(
      JSON.stringify({ ok: true, updated, skipped, total: finishedMatches.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
