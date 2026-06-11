-- ============================================================
-- AceCourt group owner + court booking flow
-- ============================================================
-- Run after the base schema and 001_win_queue_logic.sql.
-- This supports the prototype login-by-name flow before Supabase Auth is wired.

alter table public.groups
  alter column admin_id drop not null,
  add column if not exists admin_name text,
  add column if not exists duration_hours numeric(5,2) not null default 1;

alter table public.courts
  add column if not exists scheduled_at timestamptz,
  add column if not exists duration_hours numeric(5,2) not null default 1;

create index if not exists idx_groups_admin_name_created_at
  on public.groups (admin_name, created_at desc);

create index if not exists idx_courts_booking_lookup
  on public.courts (court_number, scheduled_at, duration_hours);

create or replace function public.has_court_booking_conflict(
  p_venue_name text,
  p_court_number int2,
  p_scheduled_at timestamptz,
  p_duration_hours numeric,
  p_excluded_group_id uuid default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.courts c
    join public.groups g on g.id = c.group_id
    where lower(coalesce(g.venue_name, '')) = lower(coalesce(p_venue_name, ''))
      and c.court_number = p_court_number
      and (p_excluded_group_id is null or g.id <> p_excluded_group_id)
      and c.scheduled_at is not null
      and p_scheduled_at < (
        c.scheduled_at + (coalesce(c.duration_hours, g.duration_hours, 1)::text || ' hours')::interval
      )
      and c.scheduled_at < (
        p_scheduled_at + (p_duration_hours::text || ' hours')::interval
      )
  );
$$;

create or replace function public.create_admin_group_with_court(
  p_admin_name text,
  p_venue_name text,
  p_group_name text,
  p_description text,
  p_court_number int,
  p_scheduled_at text,
  p_duration_hours numeric,
  p_high_score_mode boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_court_id uuid;
  v_scheduled_at timestamptz;
begin
  if length(trim(coalesce(p_admin_name, ''))) = 0 then
    raise exception 'Admin name is required';
  end if;

  if length(trim(coalesce(p_venue_name, ''))) = 0
    or length(trim(coalesce(p_group_name, ''))) = 0
    or length(trim(coalesce(p_description, ''))) = 0 then
    raise exception 'Group details are required';
  end if;

  if p_court_number is null or p_court_number < 1 or p_court_number > 99 then
    raise exception 'Court number must be 1-99';
  end if;

  if p_duration_hours is null or p_duration_hours <= 0 or p_duration_hours > 24 then
    raise exception 'Duration must be between 1 and 24 hours';
  end if;

  v_scheduled_at := p_scheduled_at::timestamptz;

  if public.has_court_booking_conflict(
    p_venue_name,
    p_court_number::int2,
    v_scheduled_at,
    p_duration_hours,
    null
  ) then
    raise exception 'Court is already booked at this time';
  end if;

  insert into public.groups (
    admin_id,
    admin_name,
    name,
    venue_name,
    num_courts,
    scheduled_at,
    duration_hours,
    description,
    high_score_mode
  )
  values (
    auth.uid(),
    trim(p_admin_name),
    trim(p_group_name),
    trim(p_venue_name),
    1,
    v_scheduled_at,
    p_duration_hours,
    trim(p_description),
    coalesce(p_high_score_mode, false)
  )
  returning id into v_group_id;

  select id
  into v_court_id
  from public.courts
  where group_id = v_group_id
  order by court_number
  limit 1;

  if v_court_id is null then
    insert into public.courts (
      group_id,
      court_number,
      scheduled_at,
      duration_hours
    )
    values (
      v_group_id,
      p_court_number::int2,
      v_scheduled_at,
      p_duration_hours
    );
  else
    update public.courts
    set
      court_number = p_court_number::int2,
      scheduled_at = v_scheduled_at,
      duration_hours = p_duration_hours
    where id = v_court_id;
  end if;

  return v_group_id;
end;
$$;

grant execute on function public.create_admin_group_with_court(
  text,
  text,
  text,
  text,
  int,
  text,
  numeric,
  boolean
) to anon, authenticated;

create or replace function public.add_admin_court_booking(
  p_admin_name text,
  p_group_id uuid,
  p_court_number int,
  p_scheduled_at text,
  p_duration_hours numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups%rowtype;
  v_court_id uuid;
  v_scheduled_at timestamptz;
begin
  if length(trim(coalesce(p_admin_name, ''))) = 0 then
    raise exception 'Admin name is required';
  end if;

  select *
  into v_group
  from public.groups
  where id = p_group_id
    and admin_name = trim(p_admin_name)
  for update;

  if not found then
    raise exception 'Group not found or you are not this group admin';
  end if;

  if p_court_number is null or p_court_number < 1 or p_court_number > 99 then
    raise exception 'Court number must be 1-99';
  end if;

  if p_duration_hours is null or p_duration_hours <= 0 or p_duration_hours > 24 then
    raise exception 'Duration must be between 1 and 24 hours';
  end if;

  v_scheduled_at := p_scheduled_at::timestamptz;

  if exists (
    select 1
    from public.courts
    where group_id = p_group_id
      and court_number = p_court_number::int2
  ) then
    raise exception 'This group already has this court number';
  end if;

  if public.has_court_booking_conflict(
    v_group.venue_name,
    p_court_number::int2,
    v_scheduled_at,
    p_duration_hours,
    p_group_id
  ) then
    raise exception 'Court is already booked at this time';
  end if;

  insert into public.courts (
    group_id,
    court_number,
    scheduled_at,
    duration_hours
  )
  values (
    p_group_id,
    p_court_number::int2,
    v_scheduled_at,
    p_duration_hours
  )
  returning id into v_court_id;

  update public.groups
  set num_courts = (
    select count(*)::int2
    from public.courts
    where group_id = p_group_id
  )
  where id = p_group_id;

  return v_court_id;
end;
$$;

grant execute on function public.add_admin_court_booking(
  text,
  uuid,
  int,
  text,
  numeric
) to anon, authenticated;
