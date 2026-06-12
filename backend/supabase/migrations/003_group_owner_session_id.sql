-- ============================================================
-- AceCourt owner session id fix
-- ============================================================
-- Names are display values only. Ownership must use a generated session id
-- so two admins with the same display name do not see each other's groups.

alter table public.groups
  add column if not exists admin_session_id text;

create index if not exists idx_groups_admin_session_created_at
  on public.groups (admin_session_id, created_at desc);

drop function if exists public.create_admin_group_with_court(
  text,
  text,
  text,
  text,
  int,
  text,
  numeric,
  boolean
);

drop function if exists public.create_admin_group_with_court(
  text,
  text,
  text,
  text,
  text,
  int,
  text,
  numeric,
  boolean
);

create or replace function public.create_admin_group_with_court(
  p_admin_name text,
  p_admin_session_id text,
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

  if length(trim(coalesce(p_admin_session_id, ''))) = 0 then
    raise exception 'Admin session is required';
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
    admin_session_id,
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
    trim(p_admin_session_id),
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
  text,
  int,
  text,
  numeric,
  boolean
) to anon, authenticated;

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
language sql
security definer
set search_path = public
as $$
  select public.create_admin_group_with_court(
    p_admin_name,
    'legacy-' || gen_random_uuid()::text,
    p_venue_name,
    p_group_name,
    p_description,
    p_court_number,
    p_scheduled_at,
    p_duration_hours,
    p_high_score_mode
  );
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

drop function if exists public.add_admin_court_booking(
  text,
  uuid,
  int,
  text,
  numeric
);

drop function if exists public.add_admin_court_booking(
  text,
  text,
  uuid,
  int,
  text,
  numeric
);

create or replace function public.add_admin_court_booking(
  p_admin_name text,
  p_admin_session_id text,
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

  if length(trim(coalesce(p_admin_session_id, ''))) = 0 then
    raise exception 'Admin session is required';
  end if;

  select *
  into v_group
  from public.groups
  where id = p_group_id
    and admin_session_id = trim(p_admin_session_id)
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
  text,
  uuid,
  int,
  text,
  numeric
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
  v_admin_session_id text;
begin
  select admin_session_id
  into v_admin_session_id
  from public.groups
  where id = p_group_id
    and admin_name = trim(p_admin_name);

  if v_admin_session_id is null then
    raise exception 'Group not found or you are not this group admin';
  end if;

  return public.add_admin_court_booking(
    p_admin_name,
    v_admin_session_id,
    p_group_id,
    p_court_number,
    p_scheduled_at,
    p_duration_hours
  );
end;
$$;

grant execute on function public.add_admin_court_booking(
  text,
  uuid,
  int,
  text,
  numeric
) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
