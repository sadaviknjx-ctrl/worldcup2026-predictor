-- ══════════════════════════════════════════════════════════════════════════════
-- 2018 FIFA World Cup — Russia — Full 64 matches
-- Teams already in DB from 2022 WC use real API-Football IDs.
-- 2018-only teams get synthetic IDs in the 9001xxx range.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── New teams (2018-only, not in 2022 or 2026) ───────────────────────────────
insert into teams (id, name, name_zh, flag_emoji) values
  (9001001, 'Russia',  '俄罗斯', '🇷🇺'),
  (9001002, 'Peru',    '秘鲁',   '🇵🇪'),
  (9001003, 'Iceland', '冰岛',   '🇮🇸'),
  (9001004, 'Nigeria', '尼日利亚','🇳🇬')
on conflict (id) do update set
  name     = excluded.name,
  name_zh  = excluded.name_zh,
  flag_emoji = excluded.flag_emoji;

-- ── Season record for 2018 WC ─────────────────────────────────────────────────
insert into seasons (competition_id, year)
values (1, 2018)
on conflict (competition_id, year) do nothing;

-- ══════════════════════════════════════════════════════════════════════════════
-- GROUP STAGE — Matchday 1
-- ══════════════════════════════════════════════════════════════════════════════
insert into matches
  (id, competition_id, tier, round, home_team_id, away_team_id,
   home_score, away_score, match_date, status)
values
-- Group A
(9002001, 1, 2, 'Group Stage - Matchday 1', 9001001, 23, 5, 0, '2018-06-14T15:00:00Z', 'finished'),  -- Russia 5-0 Saudi Arabia
(9002002, 1, 2, 'Group Stage - Matchday 1', 9000022,  7, 0, 1, '2018-06-15T12:00:00Z', 'finished'),  -- Egypt 0-1 Uruguay
-- Group B
(9002003, 1, 2, 'Group Stage - Matchday 1', 31,      22, 0, 1, '2018-06-15T15:00:00Z', 'finished'),  -- Morocco 0-1 Iran
(9002004, 1, 2, 'Group Stage - Matchday 1', 27,       9, 3, 3, '2018-06-15T18:00:00Z', 'finished'),  -- Portugal 3-3 Spain
-- Group C
(9002005, 1, 2, 'Group Stage - Matchday 1',  2,      20, 2, 1, '2018-06-16T09:00:00Z', 'finished'),  -- France 2-1 Australia
(9002006, 1, 2, 'Group Stage - Matchday 1', 9001002, 21, 0, 1, '2018-06-16T12:00:00Z', 'finished'),  -- Peru 0-1 Denmark
-- Group D
(9002007, 1, 2, 'Group Stage - Matchday 1', 26,  9001003, 1, 1, '2018-06-16T15:00:00Z', 'finished'), -- Argentina 1-1 Iceland
(9002008, 1, 2, 'Group Stage - Matchday 1',  3,  9001004, 2, 0, '2018-06-16T18:00:00Z', 'finished'), -- Croatia 2-0 Nigeria
-- Group E
(9002009, 1, 2, 'Group Stage - Matchday 1', 29,      14, 0, 1, '2018-06-17T12:00:00Z', 'finished'),  -- Costa Rica 0-1 Serbia
(9002010, 1, 2, 'Group Stage - Matchday 1',  6,      15, 1, 1, '2018-06-17T15:00:00Z', 'finished'),  -- Brazil 1-1 Switzerland
-- Group F
(9002011, 1, 2, 'Group Stage - Matchday 1', 25,      16, 0, 1, '2018-06-17T18:00:00Z', 'finished'),  -- Germany 0-1 Mexico
(9002012, 1, 2, 'Group Stage - Matchday 1', 9000010, 17, 1, 0, '2018-06-18T12:00:00Z', 'finished'),  -- Sweden 1-0 South Korea
-- Group G
(9002013, 1, 2, 'Group Stage - Matchday 1',  1,  9000021, 3, 0, '2018-06-18T15:00:00Z', 'finished'), -- Belgium 3-0 Panama
(9002014, 1, 2, 'Group Stage - Matchday 1', 28,      10, 1, 2, '2018-06-18T18:00:00Z', 'finished'),  -- Tunisia 1-2 England
-- Group H
(9002015, 1, 2, 'Group Stage - Matchday 1', 9000019, 12, 1, 2, '2018-06-19T12:00:00Z', 'finished'),  -- Colombia 1-2 Japan
(9002016, 1, 2, 'Group Stage - Matchday 1', 24,      13, 1, 2, '2018-06-19T15:00:00Z', 'finished'),  -- Poland 1-2 Senegal

-- ══════════════════════════════════════════════════════════════════════════════
-- GROUP STAGE — Matchday 2
-- ══════════════════════════════════════════════════════════════════════════════
-- Group A
(9002017, 1, 2, 'Group Stage - Matchday 2', 9001001, 9000022, 3, 0, '2018-06-19T18:00:00Z', 'finished'), -- Russia 3-0 Egypt
(9002018, 1, 2, 'Group Stage - Matchday 2',  7,       23,     1, 0, '2018-06-20T15:00:00Z', 'finished'), -- Uruguay 1-0 Saudi Arabia
-- Group B
(9002019, 1, 2, 'Group Stage - Matchday 2', 27,      31, 1, 0, '2018-06-20T12:00:00Z', 'finished'),  -- Portugal 1-0 Morocco
(9002020, 1, 2, 'Group Stage - Matchday 2', 22,       9, 0, 1, '2018-06-20T18:00:00Z', 'finished'),  -- Iran 0-1 Spain
-- Group C
(9002021, 1, 2, 'Group Stage - Matchday 2', 21,      20, 1, 1, '2018-06-21T12:00:00Z', 'finished'),  -- Denmark 1-1 Australia
(9002022, 1, 2, 'Group Stage - Matchday 2',  2,  9001002, 1, 0, '2018-06-21T15:00:00Z', 'finished'), -- France 1-0 Peru
-- Group D
(9002023, 1, 2, 'Group Stage - Matchday 2', 26,       3, 0, 3, '2018-06-21T18:00:00Z', 'finished'),  -- Argentina 0-3 Croatia
(9002024, 1, 2, 'Group Stage - Matchday 2', 9001004, 9001003, 2, 0, '2018-06-22T15:00:00Z', 'finished'), -- Nigeria 2-0 Iceland
-- Group E
(9002025, 1, 2, 'Group Stage - Matchday 2',  6,      29, 2, 0, '2018-06-22T12:00:00Z', 'finished'),  -- Brazil 2-0 Costa Rica
(9002026, 1, 2, 'Group Stage - Matchday 2', 14,      15, 1, 2, '2018-06-22T18:00:00Z', 'finished'),  -- Serbia 1-2 Switzerland
-- Group F
(9002027, 1, 2, 'Group Stage - Matchday 2', 17,      16, 1, 2, '2018-06-23T12:00:00Z', 'finished'),  -- South Korea 1-2 Mexico
(9002028, 1, 2, 'Group Stage - Matchday 2', 25,  9000010, 2, 1, '2018-06-23T15:00:00Z', 'finished'), -- Germany 2-1 Sweden
-- Group G
(9002029, 1, 2, 'Group Stage - Matchday 2',  1,      28, 5, 2, '2018-06-23T18:00:00Z', 'finished'),  -- Belgium 5-2 Tunisia
(9002030, 1, 2, 'Group Stage - Matchday 2', 10,  9000021, 6, 1, '2018-06-24T15:00:00Z', 'finished'), -- England 6-1 Panama
-- Group H
(9002031, 1, 2, 'Group Stage - Matchday 2', 12,      13, 2, 2, '2018-06-24T12:00:00Z', 'finished'),  -- Japan 2-2 Senegal
(9002032, 1, 2, 'Group Stage - Matchday 2', 24,  9000019, 0, 3, '2018-06-24T18:00:00Z', 'finished'), -- Poland 0-3 Colombia

-- ══════════════════════════════════════════════════════════════════════════════
-- GROUP STAGE — Matchday 3
-- ══════════════════════════════════════════════════════════════════════════════
-- Group A
(9002033, 1, 2, 'Group Stage - Matchday 3',  7,  9001001, 3, 0, '2018-06-25T14:00:00Z', 'finished'), -- Uruguay 3-0 Russia
(9002034, 1, 2, 'Group Stage - Matchday 3', 23,  9000022, 2, 1, '2018-06-25T14:00:00Z', 'finished'), -- Saudi Arabia 2-1 Egypt
-- Group B
(9002035, 1, 2, 'Group Stage - Matchday 3', 22,      27, 1, 1, '2018-06-25T18:00:00Z', 'finished'),  -- Iran 1-1 Portugal
(9002036, 1, 2, 'Group Stage - Matchday 3',  9,      31, 2, 2, '2018-06-25T18:00:00Z', 'finished'),  -- Spain 2-2 Morocco
-- Group C
(9002037, 1, 2, 'Group Stage - Matchday 3',  2,      21, 0, 0, '2018-06-26T14:00:00Z', 'finished'),  -- France 0-0 Denmark
(9002038, 1, 2, 'Group Stage - Matchday 3', 20,  9001002, 0, 2, '2018-06-26T14:00:00Z', 'finished'), -- Australia 0-2 Peru
-- Group D
(9002039, 1, 2, 'Group Stage - Matchday 3', 9001003,  3, 1, 2, '2018-06-26T18:00:00Z', 'finished'), -- Iceland 1-2 Croatia
(9002040, 1, 2, 'Group Stage - Matchday 3', 9001004, 26, 1, 2, '2018-06-26T18:00:00Z', 'finished'), -- Nigeria 1-2 Argentina
-- Group E
(9002041, 1, 2, 'Group Stage - Matchday 3', 15,      29, 2, 2, '2018-06-27T14:00:00Z', 'finished'),  -- Switzerland 2-2 Costa Rica
(9002042, 1, 2, 'Group Stage - Matchday 3', 14,       6, 0, 2, '2018-06-27T14:00:00Z', 'finished'),  -- Serbia 0-2 Brazil
-- Group F
(9002043, 1, 2, 'Group Stage - Matchday 3', 17,      25, 2, 0, '2018-06-27T18:00:00Z', 'finished'),  -- South Korea 2-0 Germany
(9002044, 1, 2, 'Group Stage - Matchday 3', 16,  9000010, 0, 3, '2018-06-27T18:00:00Z', 'finished'), -- Mexico 0-3 Sweden
-- Group G
(9002045, 1, 2, 'Group Stage - Matchday 3', 10,       1, 0, 1, '2018-06-28T18:00:00Z', 'finished'),  -- England 0-1 Belgium
(9002046, 1, 2, 'Group Stage - Matchday 3', 9000021, 28, 1, 2, '2018-06-28T18:00:00Z', 'finished'), -- Panama 1-2 Tunisia
-- Group H
(9002047, 1, 2, 'Group Stage - Matchday 3', 12,      24, 0, 1, '2018-06-28T14:00:00Z', 'finished'),  -- Japan 0-1 Poland
(9002048, 1, 2, 'Group Stage - Matchday 3', 13,  9000019, 0, 1, '2018-06-28T14:00:00Z', 'finished'), -- Senegal 0-1 Colombia

-- ══════════════════════════════════════════════════════════════════════════════
-- ROUND OF 16
-- ══════════════════════════════════════════════════════════════════════════════
(9002049, 1, 2, 'Round of 16',  2,      26, 4, 3, '2018-06-30T14:00:00Z', 'finished'),  -- France 4-3 Argentina
(9002050, 1, 2, 'Round of 16',  7,      27, 2, 1, '2018-06-30T18:00:00Z', 'finished'),  -- Uruguay 2-1 Portugal
(9002051, 1, 2, 'Round of 16',  9,  9001001, 1, 1, '2018-07-01T14:00:00Z', 'finished'), -- Spain 1-1 Russia (Russia on pens)
(9002052, 1, 2, 'Round of 16',  3,      21, 1, 1, '2018-07-01T18:00:00Z', 'finished'),  -- Croatia 1-1 Denmark (Croatia on pens)
(9002053, 1, 2, 'Round of 16',  6,      16, 2, 0, '2018-07-02T14:00:00Z', 'finished'),  -- Brazil 2-0 Mexico
(9002054, 1, 2, 'Round of 16',  1,      12, 3, 2, '2018-07-02T18:00:00Z', 'finished'),  -- Belgium 3-2 Japan
(9002055, 1, 2, 'Round of 16',  9000010, 15, 1, 0, '2018-07-03T14:00:00Z', 'finished'), -- Sweden 1-0 Switzerland
(9002056, 1, 2, 'Round of 16',  9000019, 10, 1, 1, '2018-07-03T18:00:00Z', 'finished'), -- Colombia 1-1 England (England on pens)

-- ══════════════════════════════════════════════════════════════════════════════
-- QUARTER-FINALS
-- ══════════════════════════════════════════════════════════════════════════════
(9002057, 1, 2, 'Quarter-finals',  2,       7, 2, 0, '2018-07-06T14:00:00Z', 'finished'), -- France 2-0 Uruguay
(9002058, 1, 2, 'Quarter-finals',  1,       6, 2, 1, '2018-07-06T18:00:00Z', 'finished'), -- Belgium 2-1 Brazil
(9002059, 1, 2, 'Quarter-finals',  9001001, 3, 2, 2, '2018-07-07T14:00:00Z', 'finished'), -- Russia 2-2 Croatia (Croatia on pens)
(9002060, 1, 2, 'Quarter-finals',  9000010,10, 0, 2, '2018-07-07T18:00:00Z', 'finished'), -- Sweden 0-2 England

-- ══════════════════════════════════════════════════════════════════════════════
-- SEMI-FINALS
-- ══════════════════════════════════════════════════════════════════════════════
(9002061, 1, 2, 'Semi-finals',  2,  1, 1, 0, '2018-07-10T18:00:00Z', 'finished'), -- France 1-0 Belgium
(9002062, 1, 2, 'Semi-finals',  3, 10, 2, 1, '2018-07-11T18:00:00Z', 'finished'), -- Croatia 2-1 England (aet)

-- ══════════════════════════════════════════════════════════════════════════════
-- 3RD PLACE & FINAL
-- ══════════════════════════════════════════════════════════════════════════════
(9002063, 1, 2, '3rd Place',  1, 10, 2, 0, '2018-07-14T14:00:00Z', 'finished'), -- Belgium 2-0 England
(9002064, 1, 2, 'Final',      2,  3, 4, 2, '2018-07-15T15:00:00Z', 'finished')  -- France 4-2 Croatia
on conflict (id) do update set
  home_score  = excluded.home_score,
  away_score  = excluded.away_score,
  status      = excluded.status,
  round       = excluded.round;

-- verify
select round, count(*) as matches from matches where id between 9002001 and 9002064 group by round order by min(match_date);
