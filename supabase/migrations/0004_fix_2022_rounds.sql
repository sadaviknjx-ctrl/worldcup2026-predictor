-- Backfill round field for 2022 WC matches (tier=2) based on known match dates
-- Qatar 2022 schedule dates are fixed facts

update matches set round = 'Group Stage - Matchday 1'
where tier = 2
  and match_date >= '2022-11-20' and match_date < '2022-11-25';

update matches set round = 'Group Stage - Matchday 2'
where tier = 2
  and match_date >= '2022-11-25' and match_date < '2022-11-30';

update matches set round = 'Group Stage - Matchday 3'
where tier = 2
  and match_date >= '2022-11-29' and match_date < '2022-12-03';

update matches set round = 'Round of 16'
where tier = 2
  and match_date >= '2022-12-03' and match_date < '2022-12-07';

update matches set round = 'Quarter-finals'
where tier = 2
  and match_date >= '2022-12-09' and match_date < '2022-12-11';

update matches set round = 'Semi-finals'
where tier = 2
  and match_date >= '2022-12-13' and match_date < '2022-12-15';

update matches set round = '3rd Place'
where tier = 2
  and match_date >= '2022-12-17' and match_date < '2022-12-18';

update matches set round = 'Final'
where tier = 2
  and match_date >= '2022-12-18';

-- verify
select round, count(*) from matches where tier = 2 group by round order by min(match_date);
