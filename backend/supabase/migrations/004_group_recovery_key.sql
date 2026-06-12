-- ============================================================
-- AceCourt group recovery key
-- ============================================================
-- The recovery key is returned to the admin only once after creating a group.
-- The database stores only a hash, so public group reads do not leak the key.

create extension if not exists pgcrypto with schema extensions;

alter table public.groups
  add column if not exists admin_key_hash text;

create or replace function public.generate_admin_key()
returns text
language plpgsql
set search_path = public
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  generated_key text;
  i int;
begin
  generated_key := 'ADM-';

  for i in 1..4 loop
    generated_key := generated_key || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;

  generated_key := generated_key || '-';

  for i in 1..4 loop
    generated_key := generated_key || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;

  return generated_key;
end;
$$;

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
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_group_id uuid;
  v_group_code text;
  v_admin_key text;
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
    or length(trim(coalesce(p_group_name, ''))) = 0 then
    raise exception 'Group details are required';
  end if;

  if p_court_number is null or p_court_number < 1 or p_court_number > 99 then
    raise exception 'Court number must be 1-99';
  end if;

  if p_duration_hours is null or p_duration_hours <= 0 or p_duration_hours > 24 then
    raise exception 'Duration must be between 1 and 24 hours';
  end if;

  v_scheduled_at := p_scheduled_at::timestamptz;
  v_admin_key := public.generate_admin_key();

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
    admin_key_hash,
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
    extensions.crypt(v_admin_key, extensions.gen_salt('bf')),
    trim(p_group_name),
    trim(p_venue_name),
    1,
    v_scheduled_at,
    p_duration_hours,
    nullif(trim(coalesce(p_description, '')), ''),
    coalesce(p_high_score_mode, false)
  )
  returning id, code into v_group_id, v_group_code;

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

  return jsonb_build_object(
    'group_id', v_group_id,
    'group_code', v_group_code,
    'admin_key', v_admin_key
  );
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
returns jsonb
language sql
security definer
set search_path = public, extensions
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

drop function if exists public.recover_admin_group(text, text, text, text);

create or replace function public.recover_admin_group(
  p_admin_name text,
  p_admin_session_id text,
  p_group_code text,
  p_admin_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_group public.groups%rowtype;
  v_normalized_admin_key text;
begin
  if length(trim(coalesce(p_admin_name, ''))) = 0 then
    raise exception 'Admin name is required';
  end if;

  if length(trim(coalesce(p_admin_session_id, ''))) = 0 then
    raise exception 'Admin session is required';
  end if;

  v_normalized_admin_key := upper(regexp_replace(trim(coalesce(p_admin_key, '')), '[^A-Za-z0-9]', '', 'g'));
  v_normalized_admin_key :=
    substr(v_normalized_admin_key, 1, 3) || '-' ||
    substr(v_normalized_admin_key, 4, 4) || '-' ||
    substr(v_normalized_admin_key, 8, 4);

  select *
  into v_group
  from public.groups
  where upper(code) = upper(trim(p_group_code))
    and admin_key_hash = extensions.crypt(v_normalized_admin_key, admin_key_hash)
  for update;

  if not found then
    raise exception 'Invalid group code or admin recovery key';
  end if;

  update public.groups
  set
    admin_name = trim(p_admin_name),
    admin_session_id = trim(p_admin_session_id)
  where id = v_group.id
  returning * into v_group;

  return jsonb_build_object(
    'group_id', v_group.id,
    'group_code', v_group.code
  );
end;
$$;

grant execute on function public.recover_admin_group(
  text,
  text,
  text,
  text
) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');
