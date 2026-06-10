-- WorldCup 2026 Predictor — personal-use schema
-- Tier priority: 1 = 2026 World Cup, 2 = Historical World Cups, 3 = Other leagues

create table if not exists competitions (
  id            bigint primary key,           -- API-Football league id
  name          text not null,
  type          text not null check (type in ('WC_2026', 'WC_HISTORICAL', 'OTHER')),
  tier          smallint not null,            -- 1, 2, or 3 — drives display priority/order
  logo_url      text,
  country       text
);

create table if not exists seasons (
  id              bigserial primary key,
  competition_id  bigint references competitions(id) on delete cascade,
  year            int not null,
  start_date      date,
  end_date        date,
  unique (competition_id, year)
);

create table if not exists teams (
  id          bigint primary key,             -- API-Football team id
  name        text not null,
  name_zh     text,
  flag_emoji  text,
  logo_url    text,
  country     text
);

create table if not exists players (
  id            bigint primary key,           -- API-Football player id
  name          text not null,
  name_zh       text,
  photo_url     text,
  nationality   text,
  position      text,                         -- Goalkeeper / Defender / Midfielder / Attacker
  current_team_id bigint references teams(id)
);

create table if not exists matches (
  id              bigint primary key,         -- API-Football fixture id
  competition_id  bigint references competitions(id),
  season_id       bigint references seasons(id),
  tier            smallint not null,          -- denormalized from competitions.tier for fast filtering
  round           text,                       -- e.g. "Group Stage - 1", "Final"
  home_team_id    bigint references teams(id),
  away_team_id    bigint references teams(id),
  home_score      int,
  away_score      int,
  match_date      timestamptz not null,
  venue           text,
  venue_city      text,
  status          text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_matches_tier_date on matches (tier, match_date);
create index if not exists idx_matches_competition on matches (competition_id);

-- Per-match player appearance + performance — the core of "player-level granularity"
create table if not exists match_lineups (
  id            bigserial primary key,
  match_id      bigint references matches(id) on delete cascade,
  player_id     bigint references players(id) on delete cascade,
  team_id       bigint references teams(id),
  is_starter    boolean not null default false,
  minutes_played int,
  goals         int default 0,
  assists       int default 0,
  rating        numeric(3,1),                  -- API-Football match rating, e.g. 7.8
  yellow_cards  int default 0,
  red_cards     int default 0,
  unique (match_id, player_id)
);
create index if not exists idx_lineups_player on match_lineups (player_id);
create index if not exists idx_lineups_match on match_lineups (match_id);

-- My personal prediction log
create table if not exists predictions (
  id            bigserial primary key,
  match_id      bigint references matches(id) on delete cascade,
  predicted_home_score int not null,
  predicted_away_score int not null,
  points_earned int,                           -- filled in after match finishes: 3 exact / 1 result / 0
  created_at    timestamptz not null default now(),
  unique (match_id)
);

-- Sync run log — lets the UI show "last updated" and surface errors
create table if not exists sync_log (
  id          bigserial primary key,
  source      text not null,                   -- 'api-football'
  scope       text not null,                   -- 'fixtures' | 'lineups' | 'players' ...
  status      text not null check (status in ('success', 'error')),
  detail      text,
  ran_at      timestamptz not null default now()
);

-- ─── Derived view: player win-rate, the headline stat ────────────────────────
-- "When this player started, how often did their team win/draw/lose"
create or replace view player_win_rates as
select
  p.id as player_id,
  p.name,
  p.name_zh,
  p.photo_url,
  m.tier,
  ml.is_starter,
  count(*) as appearances,
  count(*) filter (
    where (ml.team_id = m.home_team_id and m.home_score > m.away_score)
       or (ml.team_id = m.away_team_id and m.away_score > m.home_score)
  ) as wins,
  count(*) filter (where m.home_score = m.away_score) as draws,
  count(*) filter (
    where (ml.team_id = m.home_team_id and m.home_score < m.away_score)
       or (ml.team_id = m.away_team_id and m.away_score < m.home_score)
  ) as losses
from match_lineups ml
join players p on p.id = ml.player_id
join matches m on m.id = ml.match_id and m.status = 'finished'
group by p.id, p.name, p.name_zh, p.photo_url, m.tier, ml.is_starter;

-- Row Level Security — single-user app, but enable RLS with an open read policy
-- and let writes happen only via the service-role key (Edge Functions).
alter table competitions enable row level security;
alter table seasons enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table matches enable row level security;
alter table match_lineups enable row level security;
alter table predictions enable row level security;
alter table sync_log enable row level security;

create policy "public read" on competitions for select using (true);
create policy "public read" on seasons for select using (true);
create policy "public read" on teams for select using (true);
create policy "public read" on players for select using (true);
create policy "public read" on matches for select using (true);
create policy "public read" on match_lineups for select using (true);
create policy "public read" on sync_log for select using (true);

-- predictions: allow read/write from the anon key since this is a personal single-user tool
create policy "anon read predictions" on predictions for select using (true);
create policy "anon write predictions" on predictions for insert with check (true);
create policy "anon update predictions" on predictions for update using (true);
create policy "anon delete predictions" on predictions for delete using (true);
