-- WorldCup 2026 Predictor — Seed 2026 WC competition, teams & group-stage fixtures
-- Run this in the Supabase SQL Editor (pure SQL, no markdown fences).
-- Safe to re-run: every INSERT uses ON CONFLICT DO NOTHING.

-- ─── 1. WC_2026 competition (id=10001, separate from WC_HISTORICAL id=1) ─────
insert into competitions (id, name, type, tier) values
  (10001, 'FIFA World Cup 2026', 'WC_2026', 1)
on conflict (id) do update set type = 'WC_2026', tier = 1, name = 'FIFA World Cup 2026';

insert into seasons (competition_id, year) values
  (10001, 2026)
on conflict (competition_id, year) do nothing;

-- ─── 2. New teams not in 2022 WC (synthetic IDs starting 9000001) ────────────
insert into teams (id, name, flag_emoji) values
  (9000001, 'South Africa',          '🇿🇦'),
  (9000002, 'Czechia',               '🇨🇿'),
  (9000003, 'Bosnia and Herzegovina','🇧🇦'),
  (9000004, 'Haiti',                 '🇭🇹'),
  (9000005, 'Scotland',              '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
  (9000006, 'Paraguay',              '🇵🇾'),
  (9000007, 'Türkiye',               '🇹🇷'),
  (9000008, 'Curaçao',               '🇨🇼'),
  (9000009, 'Ivory Coast',           '🇨🇮'),
  (9000010, 'Sweden',                '🇸🇪'),
  (9000011, 'New Zealand',           '🇳🇿'),
  (9000012, 'Cape Verde',            '🇨🇻'),
  (9000013, 'Iraq',                  '🇮🇶'),
  (9000014, 'Norway',                '🇳🇴'),
  (9000015, 'Algeria',               '🇩🇿'),
  (9000016, 'Austria',               '🇦🇹'),
  (9000017, 'Jordan',                '🇯🇴'),
  (9000018, 'Uzbekistan',            '🇺🇿'),
  (9000019, 'Colombia',              '🇨🇴'),
  (9000020, 'DR Congo',              '🇨🇩'),
  (9000021, 'Panama',                '🇵🇦'),
  (9000022, 'Egypt',                 '🇪🇬')
on conflict (id) do nothing;

-- ─── 3. Helper: look up existing-team IDs by name ────────────────────────────
-- We use CTEs to avoid repeating subqueries for every insert.

with t as (
  select id, name from teams
),
mexico        as (select id from t where name ilike '%mexico%'       limit 1),
south_korea   as (select id from t where name ilike '%korea%'        limit 1),
canada        as (select id from t where name ilike '%canada%'       limit 1),
qatar         as (select id from t where name ilike '%qatar%'        limit 1),
switzerland   as (select id from t where name ilike '%switzerland%'  limit 1),
brazil        as (select id from t where name ilike '%brazil%'       limit 1),
morocco       as (select id from t where name ilike '%morocco%'      limit 1),
usa           as (select id from t where name ilike '%united states%' or name ilike '%usa%' limit 1),
australia     as (select id from t where name ilike '%australia%'    limit 1),
germany       as (select id from t where name ilike '%germany%'      limit 1),
ecuador       as (select id from t where name ilike '%ecuador%'      limit 1),
netherlands   as (select id from t where name ilike '%netherlands%'  limit 1),
japan         as (select id from t where name ilike '%japan%'        limit 1),
tunisia       as (select id from t where name ilike '%tunisia%'      limit 1),
belgium       as (select id from t where name ilike '%belgium%'      limit 1),
iran          as (select id from t where name ilike '%iran%'         limit 1),
spain         as (select id from t where name ilike '%spain%'        limit 1),
saudi_arabia  as (select id from t where name ilike '%saudi%'        limit 1),
uruguay       as (select id from t where name ilike '%uruguay%'      limit 1),
france        as (select id from t where name ilike '%france%'       limit 1),
senegal       as (select id from t where name ilike '%senegal%'      limit 1),
argentina     as (select id from t where name ilike '%argentina%'    limit 1),
portugal      as (select id from t where name ilike '%portugal%'     limit 1),
england       as (select id from t where name ilike '%england%'      limit 1),
croatia       as (select id from t where name ilike '%croatia%'      limit 1),
ghana         as (select id from t where name ilike '%ghana%'        limit 1)

-- ─── 4. Group-stage fixtures (72 matches, IDs 9000101–9000172) ───────────────
-- Times are UTC. Source: Sky Sports / NBC Sports official schedule.
-- Matchday 3 pairs always play simultaneously (same UTC time).

insert into matches (id, competition_id, tier, round, home_team_id, away_team_id, match_date, status)
select v.id, 10001, 1, v.round, v.home_id, v.away_id, v.match_date::timestamptz, 'upcoming'
from (values
  -- ── Group A: Mexico · South Africa · South Korea · Czechia ──
  (9000101,'Group A - Matchday 1',(select id from mexico),     9000001,           '2026-06-11 19:00:00+00'),
  (9000102,'Group A - Matchday 1',(select id from south_korea),9000002,           '2026-06-12 02:00:00+00'),
  (9000103,'Group A - Matchday 2',9000002,                     9000001,           '2026-06-18 16:00:00+00'),
  (9000104,'Group A - Matchday 2',(select id from mexico),     (select id from south_korea),'2026-06-19 01:00:00+00'),
  (9000105,'Group A - Matchday 3',9000001,                     (select id from south_korea),'2026-06-25 01:00:00+00'),
  (9000106,'Group A - Matchday 3',9000002,                     (select id from mexico),     '2026-06-25 01:00:00+00'),

  -- ── Group B: Canada · Bosnia and Herzegovina · Qatar · Switzerland ──
  (9000107,'Group B - Matchday 1',(select id from canada),     9000003,           '2026-06-12 19:00:00+00'),
  (9000108,'Group B - Matchday 1',(select id from qatar),      (select id from switzerland),'2026-06-13 19:00:00+00'),
  (9000109,'Group B - Matchday 2',(select id from switzerland),9000003,           '2026-06-18 19:00:00+00'),
  (9000110,'Group B - Matchday 2',(select id from canada),     (select id from qatar),      '2026-06-18 22:00:00+00'),
  (9000111,'Group B - Matchday 3',(select id from switzerland),(select id from canada),     '2026-06-24 19:00:00+00'),
  (9000112,'Group B - Matchday 3',9000003,                     (select id from qatar),      '2026-06-24 19:00:00+00'),

  -- ── Group C: Brazil · Haiti · Morocco · Scotland ──
  (9000113,'Group C - Matchday 1',(select id from brazil),     (select id from morocco),    '2026-06-13 22:00:00+00'),
  (9000114,'Group C - Matchday 1',9000004,                     9000005,                     '2026-06-14 01:00:00+00'),
  (9000115,'Group C - Matchday 2',(select id from brazil),     9000004,                     '2026-06-20 00:30:00+00'),
  (9000116,'Group C - Matchday 2',9000005,                     (select id from morocco),    '2026-06-19 22:00:00+00'),
  (9000117,'Group C - Matchday 3',(select id from morocco),    9000004,                     '2026-06-24 22:00:00+00'),
  (9000118,'Group C - Matchday 3',9000005,                     (select id from brazil),     '2026-06-24 22:00:00+00'),

  -- ── Group D: Australia · Paraguay · Türkiye · USA ──
  (9000119,'Group D - Matchday 1',(select id from usa),        9000006,                     '2026-06-13 01:00:00+00'),
  (9000120,'Group D - Matchday 1',(select id from australia),  9000007,                     '2026-06-14 04:00:00+00'),
  (9000121,'Group D - Matchday 2',(select id from usa),        (select id from australia),  '2026-06-19 19:00:00+00'),
  (9000122,'Group D - Matchday 2',9000007,                     9000006,                     '2026-06-20 03:00:00+00'),
  (9000123,'Group D - Matchday 3',9000007,                     (select id from usa),        '2026-06-26 02:00:00+00'),
  (9000124,'Group D - Matchday 3',9000006,                     (select id from australia),  '2026-06-26 02:00:00+00'),

  -- ── Group E: Curaçao · Ecuador · Germany · Ivory Coast ──
  (9000125,'Group E - Matchday 1',(select id from germany),    9000008,                     '2026-06-14 17:00:00+00'),
  (9000126,'Group E - Matchday 1',9000009,                     (select id from ecuador),    '2026-06-14 23:00:00+00'),
  (9000127,'Group E - Matchday 2',(select id from germany),    9000009,                     '2026-06-20 20:00:00+00'),
  (9000128,'Group E - Matchday 2',(select id from ecuador),    9000008,                     '2026-06-21 00:00:00+00'),
  (9000129,'Group E - Matchday 3',9000008,                     9000009,                     '2026-06-25 20:00:00+00'),
  (9000130,'Group E - Matchday 3',(select id from ecuador),    (select id from germany),    '2026-06-25 20:00:00+00'),

  -- ── Group F: Japan · Netherlands · Sweden · Tunisia ──
  (9000131,'Group F - Matchday 1',(select id from netherlands),(select id from japan),      '2026-06-14 20:00:00+00'),
  (9000132,'Group F - Matchday 1',9000010,                     (select id from tunisia),    '2026-06-15 02:00:00+00'),
  (9000133,'Group F - Matchday 2',(select id from netherlands),9000010,                     '2026-06-20 19:00:00+00'),
  (9000134,'Group F - Matchday 2',(select id from tunisia),    (select id from japan),      '2026-06-21 04:00:00+00'),
  (9000135,'Group F - Matchday 3',(select id from tunisia),    (select id from netherlands),'2026-06-25 23:00:00+00'),
  (9000136,'Group F - Matchday 3',(select id from japan),      9000010,                     '2026-06-25 23:00:00+00'),

  -- ── Group G: Belgium · Egypt · Iran · New Zealand ──
  (9000137,'Group G - Matchday 1',(select id from belgium),    9000022,                     '2026-06-15 19:00:00+00'),
  (9000138,'Group G - Matchday 1',(select id from iran),       9000011,                     '2026-06-16 01:00:00+00'),
  (9000139,'Group G - Matchday 2',(select id from belgium),    (select id from iran),       '2026-06-21 19:00:00+00'),
  (9000140,'Group G - Matchday 2',9000011,                     9000022,                     '2026-06-22 01:00:00+00'),
  (9000141,'Group G - Matchday 3',9000011,                     (select id from belgium),    '2026-06-27 03:00:00+00'),
  (9000142,'Group G - Matchday 3',9000022,                     (select id from iran),       '2026-06-27 03:00:00+00'),

  -- ── Group H: Cape Verde · Saudi Arabia · Spain · Uruguay ──
  (9000143,'Group H - Matchday 1',(select id from spain),      9000012,                     '2026-06-15 16:00:00+00'),
  (9000144,'Group H - Matchday 1',(select id from saudi_arabia),(select id from uruguay),   '2026-06-15 22:00:00+00'),
  (9000145,'Group H - Matchday 2',(select id from spain),      (select id from saudi_arabia),'2026-06-21 16:00:00+00'),
  (9000146,'Group H - Matchday 2',(select id from uruguay),    9000012,                     '2026-06-21 22:00:00+00'),
  (9000147,'Group H - Matchday 3',9000012,                     (select id from saudi_arabia),'2026-06-27 00:00:00+00'),
  (9000148,'Group H - Matchday 3',(select id from uruguay),    (select id from spain),      '2026-06-27 00:00:00+00'),

  -- ── Group I: France · Iraq · Norway · Senegal ──
  (9000149,'Group I - Matchday 1',(select id from france),     (select id from senegal),    '2026-06-16 19:00:00+00'),
  (9000150,'Group I - Matchday 1',9000013,                     9000014,                     '2026-06-16 22:00:00+00'),
  (9000151,'Group I - Matchday 2',(select id from france),     9000013,                     '2026-06-22 21:00:00+00'),
  (9000152,'Group I - Matchday 2',9000014,                     (select id from senegal),    '2026-06-23 00:00:00+00'),
  (9000153,'Group I - Matchday 3',9000014,                     (select id from france),     '2026-06-26 19:00:00+00'),
  (9000154,'Group I - Matchday 3',(select id from senegal),    9000013,                     '2026-06-26 19:00:00+00'),

  -- ── Group J: Algeria · Argentina · Austria · Jordan ──
  (9000155,'Group J - Matchday 1',(select id from argentina),  9000015,                     '2026-06-17 01:00:00+00'),
  (9000156,'Group J - Matchday 1',9000016,                     9000017,                     '2026-06-17 04:00:00+00'),
  (9000157,'Group J - Matchday 2',(select id from argentina),  9000016,                     '2026-06-22 17:00:00+00'),
  (9000158,'Group J - Matchday 2',9000017,                     9000015,                     '2026-06-23 03:00:00+00'),
  (9000159,'Group J - Matchday 3',9000015,                     9000016,                     '2026-06-28 02:00:00+00'),
  (9000160,'Group J - Matchday 3',9000017,                     (select id from argentina),  '2026-06-28 02:00:00+00'),

  -- ── Group K: Colombia · DR Congo · Portugal · Uzbekistan ──
  (9000161,'Group K - Matchday 1',(select id from portugal),   9000020,                     '2026-06-17 17:00:00+00'),
  (9000162,'Group K - Matchday 1',9000018,                     9000019,                     '2026-06-18 02:00:00+00'),
  (9000163,'Group K - Matchday 2',(select id from portugal),   9000018,                     '2026-06-23 17:00:00+00'),
  (9000164,'Group K - Matchday 2',9000019,                     9000020,                     '2026-06-24 02:00:00+00'),
  (9000165,'Group K - Matchday 3',9000019,                     (select id from portugal),   '2026-06-27 23:30:00+00'),
  (9000166,'Group K - Matchday 3',9000020,                     9000018,                     '2026-06-27 23:30:00+00'),

  -- ── Group L: Croatia · England · Ghana · Panama ──
  (9000167,'Group L - Matchday 1',(select id from england),    (select id from croatia),    '2026-06-17 20:00:00+00'),
  (9000168,'Group L - Matchday 1',(select id from ghana),      9000021,                     '2026-06-17 23:00:00+00'),
  (9000169,'Group L - Matchday 2',(select id from england),    (select id from ghana),      '2026-06-23 20:00:00+00'),
  (9000170,'Group L - Matchday 2',9000021,                     (select id from croatia),    '2026-06-23 23:00:00+00'),
  (9000171,'Group L - Matchday 3',9000021,                     (select id from england),    '2026-06-27 21:00:00+00'),
  (9000172,'Group L - Matchday 3',(select id from croatia),    (select id from ghana),      '2026-06-27 21:00:00+00')
) as v(id, round, home_id, away_id, match_date)
on conflict (id) do nothing;
