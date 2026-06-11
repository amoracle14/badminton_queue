-- ============================================================
-- AceCourt win button + rotating queue logic
-- ============================================================
-- Run this in Supabase SQL Editor.
--
-- Behavior:
-- 1. Press WIN on team A/B -> that team's win count increments.
-- 2. The losing team leaves immediately and goes to the bottom of the queue.
-- 3. If the winner has not reached 2/2:
--    - the winner stays on court
--    - the next waiting team (2 players) replaces the loser
--    - the losing side win counter resets to 0
-- 4. If the winner reaches 2/2:
--    - the match is finished
--    - loser players go to the bottom of the waiting queue first
--    - winner players go behind the loser players
--    - the first 4 waiting players are moved onto the same court as a new match

alter table public.matches
  add column if not exists team_a_wins int2 not null default 0
    check (team_a_wins between 0 and 2),
  add column if not exists team_b_wins int2 not null default 0
    check (team_b_wins between 0 and 2);

alter table public.players
  add column if not exists queue_order int4,
  add column if not exists court_id uuid references public.courts(id) on delete set null,
  add column if not exists team_id uuid,
  add column if not exists team_slot int2 check (team_slot in (1, 2)),
  add column if not exists team_profile text;

create index if not exists idx_players_court_status_queue
  on public.players (court_id, status, queue_order, team_slot, created_at);

create index if not exists idx_players_team_id
  on public.players (team_id);

create index if not exists idx_groups_created_at_desc
  on public.groups (created_at desc);

create index if not exists idx_courts_group_court_number
  on public.courts (group_id, court_number);

create index if not exists idx_matches_court_status_started
  on public.matches (court_id, status, started_at desc);

alter table public.profiles
  add column if not exists role text not null default 'admin';

update public.profiles
set role = 'admin'
where role is null;

create table if not exists public.match_players (
  id          uuid primary key default gen_random_uuid(),
  match_id    uuid not null references public.matches(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  team        text not null check (team in ('A', 'B')),
  slot        int2 not null check (slot in (1, 2)),
  created_at  timestamptz not null default now(),
  unique (match_id, player_id),
  unique (match_id, team, slot)
);

create index if not exists idx_match_players_match_team_slot
  on public.match_players (match_id, team, slot);

with active_match_teams as (
  select
    mp.match_id,
    mp.team,
    gen_random_uuid() as team_id
  from public.match_players mp
  join public.players p on p.id = mp.player_id
  where p.team_id is null
  group by mp.match_id, mp.team
)
update public.players p
set
  team_id = active_match_teams.team_id,
  team_slot = mp.slot,
  team_profile = coalesce(
    p.team_profile,
    'profile-01.svg'
  )
from public.match_players mp
join active_match_teams
  on active_match_teams.match_id = mp.match_id
  and active_match_teams.team = mp.team
where p.id = mp.player_id
  and p.team_id is null;

with ordered_waiting_players as (
  select
    id,
    court_id,
    row_number() over (
      partition by court_id
      order by queue_order asc nulls last, created_at asc, id asc
    ) as row_number
  from public.players
  where team_id is null
    and court_id is not null
    and status = 'waiting'
),
paired_waiting_players as (
  select
    id,
    court_id,
    ((row_number - 1) / 2)::int as pair_index,
    (((row_number - 1) % 2) + 1)::int2 as team_slot
  from ordered_waiting_players
),
waiting_team_ids as (
  select
    court_id,
    pair_index,
    gen_random_uuid() as team_id
  from paired_waiting_players
  group by court_id, pair_index
)
update public.players p
set
  team_id = waiting_team_ids.team_id,
  team_slot = paired_waiting_players.team_slot,
  team_profile = coalesce(
    p.team_profile,
    'profile-01.svg'
  )
from paired_waiting_players
join waiting_team_ids
  on waiting_team_ids.court_id = paired_waiting_players.court_id
  and waiting_team_ids.pair_index = paired_waiting_players.pair_index
where p.id = paired_waiting_players.id
  and p.team_id is null;

with team_profile_backfill as (
  select
    team_id,
    'profile-' ||
      lpad(((abs(hashtext(team_id::text)) % 43) + 1)::text, 2, '0') ||
      '.svg' as team_profile
  from public.players
  where team_id is not null
  group by team_id
)
update public.players p
set team_profile = team_profile_backfill.team_profile
from team_profile_backfill
where p.team_id = team_profile_backfill.team_id
  and (
    p.team_profile is null
    or p.team_profile like 'ChatGPT Image%'
    or p.team_profile = 'profile-01.svg'
  );

alter table public.match_players enable row level security;

drop policy if exists "match_players: public read" on public.match_players;
create policy "match_players: public read"
  on public.match_players for select
  using (true);

drop policy if exists "match_players: admin write" on public.match_players;
create policy "match_players: admin write"
  on public.match_players for all
  using (
    auth.uid() in (select id from public.profiles where role = 'admin')
  )
  with check (
    auth.uid() in (select id from public.profiles where role = 'admin')
  );

create or replace function public.record_match_game_win(
  p_match_id uuid,
  p_winner_team text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_winner_team text;
  v_loser_team text;
  v_next_team_a_wins int2;
  v_next_team_b_wins int2;
  v_max_queue_order int4;
  v_player_id uuid;
  v_winner_team_id uuid;
  v_loser_team_id uuid;
  v_replacement_team_id uuid;
begin
  if p_winner_team not in ('A', 'B') then
    raise exception 'Winner team must be A or B';
  end if;

  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can record match wins';
  end if;

  select *
  into v_match
  from public.matches
  where id = p_match_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Active match not found';
  end if;

  v_winner_team := p_winner_team;
  v_loser_team := case when p_winner_team = 'A' then 'B' else 'A' end;
  v_next_team_a_wins := v_match.team_a_wins;
  v_next_team_b_wins := v_match.team_b_wins;

  if p_winner_team = 'A' then
    v_next_team_a_wins := least(v_next_team_a_wins + 1, 2);
  else
    v_next_team_b_wins := least(v_next_team_b_wins + 1, 2);
  end if;

  select coalesce(max(queue_order), 0)
  into v_max_queue_order
  from public.players
  where group_id = v_match.group_id
    and court_id = v_match.court_id;

  select p.team_id
  into v_loser_team_id
  from public.match_players mp
  join public.players p on p.id = mp.player_id
  where mp.match_id = v_match.id
    and mp.team = v_loser_team
  limit 1;

  select p.team_id
  into v_winner_team_id
  from public.match_players mp
  join public.players p on p.id = mp.player_id
  where mp.match_id = v_match.id
    and mp.team = v_winner_team
  limit 1;

  -- Loser goes back into the queue first.
  v_max_queue_order := v_max_queue_order + 1;

  update public.players
  set
    status = 'waiting',
    court_id = v_match.court_id,
    queue_order = v_max_queue_order
  where team_id = v_loser_team_id;

  if v_next_team_a_wins >= 2 or v_next_team_b_wins >= 2 then
    update public.matches
    set
      status = 'finished',
      winner_team = v_winner_team,
      team_a_wins = v_next_team_a_wins,
      team_b_wins = v_next_team_b_wins,
      ended_at = now()
    where id = v_match.id;

    -- Winner goes behind the loser only after reaching 2/2.
    v_max_queue_order := v_max_queue_order + 1;

    update public.players
    set
      status = 'waiting',
      court_id = v_match.court_id,
      queue_order = v_max_queue_order
    where team_id = v_winner_team_id;

    perform public.start_next_match_for_court(v_match.court_id);

    return;
  end if;

  -- Winner stays on court. Next waiting team replaces the loser.
  select team_id
  into v_replacement_team_id
  from (
    select
      team_id,
      min(queue_order) as team_queue_order,
      min(created_at) as team_created_at
    from public.players
    where group_id = v_match.group_id
      and court_id = v_match.court_id
      and status = 'waiting'
      and team_id is not null
      and team_id <> v_loser_team_id
    group by team_id
    having count(*) = 2
    order by min(queue_order) asc nulls last, min(created_at) asc
    limit 1
  ) next_team;

  if v_replacement_team_id is null then
    -- No opponent is available. End the match and send the winner behind the loser.
    update public.matches
    set
      status = 'finished',
      winner_team = v_winner_team,
      team_a_wins = v_next_team_a_wins,
      team_b_wins = v_next_team_b_wins,
      ended_at = now()
    where id = v_match.id;

    v_max_queue_order := v_max_queue_order + 1;

    update public.players
    set
      status = 'waiting',
      court_id = v_match.court_id,
      queue_order = v_max_queue_order
    where team_id = v_winner_team_id;

    update public.courts
    set
      status = 'idle',
      score_a = 0,
      score_b = 0
    where id = v_match.court_id;

    return;
  end if;

  delete from public.match_players
  where match_id = v_match.id
    and team = v_loser_team;

  insert into public.match_players (match_id, player_id, team, slot)
  select
    v_match.id,
    id,
    v_loser_team,
    team_slot
  from public.players
  where team_id = v_replacement_team_id
  order by team_slot;

  update public.players
  set
    status = 'playing',
    court_id = v_match.court_id,
    queue_order = null
  where team_id = v_replacement_team_id;

  update public.matches
  set
    team_a_wins = case
      when v_winner_team = 'A' then v_next_team_a_wins
      else 0
    end,
    team_b_wins = case
      when v_winner_team = 'B' then v_next_team_b_wins
      else 0
    end
  where id = v_match.id;

  update public.courts
  set
    status = 'playing',
    score_a = 0,
    score_b = 0
  where id = v_match.court_id;
end;
$$;

grant execute on function public.record_match_game_win(uuid, text)
  to anon, authenticated;

create or replace function public.start_next_match_for_court(
  p_court_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court public.courts%rowtype;
  v_next_team_ids uuid[];
  v_new_match_id uuid;
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can start matches';
  end if;

  select *
  into v_court
  from public.courts
  where id = p_court_id
  for update;

  if not found then
    raise exception 'Court not found';
  end if;

  if exists (
    select 1
    from public.matches
    where court_id = p_court_id
      and status in ('active', 'paused')
  ) then
    return null;
  end if;

  select array_agg(team_id order by team_queue_order asc nulls last, team_created_at asc)
  into v_next_team_ids
  from (
    select
      team_id,
      min(queue_order) as team_queue_order,
      min(created_at) as team_created_at,
      count(*) as player_count
    from public.players
    where group_id = v_court.group_id
      and court_id = p_court_id
      and status = 'waiting'
      and team_id is not null
    group by team_id
    having count(*) = 2
    order by min(queue_order) asc nulls last, min(created_at) asc
    limit 2
  ) next_teams;

  if coalesce(array_length(v_next_team_ids, 1), 0) < 2 then
    return null;
  end if;

  insert into public.matches (
    court_id,
    group_id,
    status,
    team_a_wins,
    team_b_wins,
    started_at
  )
  values (
    p_court_id,
    v_court.group_id,
    'active',
    0,
    0,
    now()
  )
  returning id into v_new_match_id;

  insert into public.match_players (match_id, player_id, team, slot)
  select
    v_new_match_id,
    p.id,
    case when selected_teams.team_order = 1 then 'A' else 'B' end,
    p.team_slot
  from unnest(v_next_team_ids) with ordinality as selected_teams(team_id, team_order)
  join public.players p on p.team_id = selected_teams.team_id
  order by selected_teams.team_order, p.team_slot;

  update public.players
  set
    status = 'playing',
    court_id = p_court_id,
    queue_order = null
  where team_id = any(v_next_team_ids);

  update public.courts
  set
    status = 'playing',
    score_a = 0,
    score_b = 0
  where id = p_court_id;

  return v_new_match_id;
end;
$$;

grant execute on function public.start_next_match_for_court(uuid)
  to anon, authenticated;

create or replace function public.add_court_players(
  p_group_id uuid,
  p_court_id uuid,
  p_player_names text[],
  p_team_profiles text[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court public.courts%rowtype;
  v_player_count int4;
  v_max_queue_order int4;
  v_index int4;
  v_team_id uuid;
  v_team_queue_order int4;
  v_player_one_name text;
  v_player_two_name text;
  v_team_profile text;
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can add players';
  end if;

  if p_group_id is null or p_court_id is null then
    raise exception 'Group and court are required';
  end if;

  if coalesce(array_length(p_player_names, 1), 0) = 0
    or mod(array_length(p_player_names, 1), 2) <> 0 then
    raise exception 'Player names must be sent in pairs';
  end if;

  select *
  into v_court
  from public.courts
  where id = p_court_id
    and group_id = p_group_id
  for update;

  if not found then
    raise exception 'Court not found';
  end if;

  select coalesce(max(queue_order), 0)
  into v_max_queue_order
  from public.players
  where group_id = p_group_id
    and court_id = p_court_id;

  v_index := 1;

  while v_index <= array_length(p_player_names, 1) loop
    v_player_one_name := trim(p_player_names[v_index]);
    v_player_two_name := trim(p_player_names[v_index + 1]);

    if length(v_player_one_name) = 0 or length(v_player_two_name) = 0 then
      raise exception 'Player names are required';
    end if;

    v_team_id := gen_random_uuid();
    v_team_queue_order := v_max_queue_order + ((v_index + 1) / 2);
    v_team_profile := coalesce(
      p_team_profiles[((v_index + 1) / 2)],
      'profile-01.svg'
    );

    insert into public.players (
      group_id,
      court_id,
      name,
      status,
      queue_order,
      team_id,
      team_slot,
      team_profile
    )
    values
      (
        p_group_id,
        p_court_id,
        v_player_one_name,
        'waiting',
        v_team_queue_order,
        v_team_id,
        1,
        v_team_profile
      ),
      (
        p_group_id,
        p_court_id,
        v_player_two_name,
        'waiting',
        v_team_queue_order,
        v_team_id,
        2,
        v_team_profile
      );

    v_index := v_index + 2;
  end loop;

  select count(*)
  into v_player_count
  from public.players
  where group_id = p_group_id
    and court_id = p_court_id
    and status in ('waiting', 'playing');

  if v_player_count >= 4 then
    perform public.start_next_match_for_court(p_court_id);
  end if;
end;
$$;

grant execute on function public.add_court_players(uuid, uuid, text[], text[])
  to anon, authenticated;

create or replace function public.update_waiting_team(
  p_player_one_id uuid,
  p_player_one_name text,
  p_player_two_id uuid,
  p_player_two_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can update teams';
  end if;

  if length(trim(p_player_one_name)) = 0 or length(trim(p_player_two_name)) = 0 then
    raise exception 'Player names are required';
  end if;

  update public.players
  set name = trim(p_player_one_name)
  where id = p_player_one_id
    and status in ('waiting', 'playing');

  update public.players
  set name = trim(p_player_two_name)
  where id = p_player_two_id
    and status in ('waiting', 'playing');
end;
$$;

grant execute on function public.update_waiting_team(uuid, text, uuid, text)
  to anon, authenticated;

create or replace function public.delete_waiting_team(
  p_player_one_id uuid,
  p_player_two_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can delete teams';
  end if;

  delete from public.players
  where id in (p_player_one_id, p_player_two_id)
    and status = 'waiting';
end;
$$;

grant execute on function public.delete_waiting_team(uuid, uuid)
  to anon, authenticated;

create or replace function public.delete_court_team(
  p_player_one_id uuid,
  p_player_two_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_team text;
  v_court_id uuid;
  v_group_id uuid;
  v_max_queue_order int4;
  v_player_id uuid;
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can delete teams';
  end if;

  select
    mp.match_id,
    mp.team,
    m.court_id,
    m.group_id
  into
    v_match_id,
    v_team,
    v_court_id,
    v_group_id
  from public.match_players mp
  join public.matches m on m.id = mp.match_id
  where mp.player_id in (p_player_one_id, p_player_two_id)
    and m.status = 'active'
  group by mp.match_id, mp.team, m.court_id, m.group_id
  having count(*) = 2
  limit 1;

  if v_match_id is not null then
    select coalesce(max(queue_order), 0)
    into v_max_queue_order
    from public.players
    where group_id = v_group_id
      and court_id = v_court_id;

    for v_player_id in
      select player_id
      from public.match_players
      where match_id = v_match_id
        and player_id not in (p_player_one_id, p_player_two_id)
      order by team, slot
    loop
      v_max_queue_order := v_max_queue_order + 1;

      update public.players
      set
        status = 'waiting',
        court_id = v_court_id,
        queue_order = v_max_queue_order
      where id = v_player_id;
    end loop;

    delete from public.match_players
    where match_id = v_match_id;

    update public.matches
    set
      status = 'finished',
      ended_at = coalesce(ended_at, now())
    where id = v_match_id;

    delete from public.players
    where id in (p_player_one_id, p_player_two_id);

    update public.courts
    set
      status = 'idle',
      score_a = 0,
      score_b = 0
    where id = v_court_id;

    perform public.start_next_match_for_court(v_court_id);
    return;
  end if;

  delete from public.players
  where id in (p_player_one_id, p_player_two_id)
    and status = 'waiting';
end;
$$;

grant execute on function public.delete_court_team(uuid, uuid)
  to anon, authenticated;

create or replace function public.reorder_court_waiting_teams(
  p_court_id uuid,
  p_team_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court public.courts%rowtype;
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can reorder teams';
  end if;

  select *
  into v_court
  from public.courts
  where id = p_court_id
  for update;

  if not found then
    raise exception 'Court not found';
  end if;

  update public.players p
  set queue_order = ordered_teams.team_order
  from unnest(p_team_ids) with ordinality as ordered_teams(team_id, team_order)
  where p.team_id = ordered_teams.team_id
    and p.court_id = p_court_id
    and p.group_id = v_court.group_id
    and p.status = 'waiting';
end;
$$;

grant execute on function public.reorder_court_waiting_teams(uuid, uuid[])
  to anon, authenticated;

create or replace function public.delete_all_court_teams(
  p_court_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_court public.courts%rowtype;
begin
  -- Prototype-friendly guard:
  -- Anonymous calls are allowed while the app has no login screen yet.
  -- When auth is ready, replace this block with a strict admin check.
  if auth.uid() is not null and not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Only admin can delete court teams';
  end if;

  select *
  into v_court
  from public.courts
  where id = p_court_id
  for update;

  if not found then
    raise exception 'Court not found';
  end if;

  update public.matches
  set
    status = 'finished',
    ended_at = coalesce(ended_at, now())
  where court_id = p_court_id
    and status = 'active';

  delete from public.players
  where group_id = v_court.group_id
    and court_id = p_court_id;

  update public.courts
  set
    status = 'idle',
    score_a = 0,
    score_b = 0
  where id = p_court_id;
end;
$$;

grant execute on function public.delete_all_court_teams(uuid)
  to anon, authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.match_players;
  exception
    when duplicate_object then null;
  end;
end;
$$;
