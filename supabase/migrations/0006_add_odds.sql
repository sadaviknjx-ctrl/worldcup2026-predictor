-- match_odds: consensus odds fetched from The Odds API
create table if not exists match_odds (
  match_id        bigint primary key references matches(id) on delete cascade,
  home_odds       numeric(6,3),
  draw_odds       numeric(6,3),
  away_odds       numeric(6,3),
  bookmaker_count int     default 0,
  fetched_at      timestamptz default now()
);

alter table match_odds enable row level security;
create policy "public read match_odds"   on match_odds for select using (true);
create policy "service write match_odds" on match_odds for all    using (auth.role() = 'service_role');
