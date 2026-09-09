-- PDI OS Slice 3 · PR-3 — Roadmap structural editing (RN-ROADMAP-004/014).
-- SECURITY INVOKER (architecture rule 2): the RLS owner policies on
-- public.modules / public.topics apply to the calling `authenticated` role.
-- These keep `position` dense among the active (non-archived) siblings; archive
-- / restore already exist from the Foundation (archive_module / restore_module /
-- archive_topic / restore_topic). Style follows create_task / move_task.

-- --------------------------------------------------------------------------
-- Modules
-- --------------------------------------------------------------------------

create or replace function public.create_module(
  p_track_id uuid,
  p_slug text,
  p_title text,
  p_description text default null
)
returns public.modules
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_module public.modules;
  v_position integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if btrim(coalesce(p_slug, '')) = '' or btrim(coalesce(p_title, '')) = '' then
    raise exception 'module slug and title are required' using errcode = '22023';
  end if;

  perform 1 from public.tracks where id = p_track_id;
  if not found then
    raise exception 'track not found' using errcode = 'P0002';
  end if;

  select count(*)::integer into v_position
  from public.modules
  where user_id = v_user_id and track_id = p_track_id and archived_at is null;

  insert into public.modules (user_id, track_id, slug, title, description, position)
  values (v_user_id, p_track_id, btrim(p_slug), btrim(p_title),
          nullif(btrim(coalesce(p_description, '')), ''), v_position)
  returning * into v_module;
  return v_module;
end;
$$;
revoke all on function public.create_module(uuid, text, text, text) from public, anon;
grant execute on function public.create_module(uuid, text, text, text) to authenticated;

create or replace function public.update_module(
  p_module_id uuid,
  p_slug text,
  p_title text,
  p_description text default null
)
returns public.modules
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_module public.modules;
begin
  if btrim(coalesce(p_slug, '')) = '' or btrim(coalesce(p_title, '')) = '' then
    raise exception 'module slug and title are required' using errcode = '22023';
  end if;

  select * into v_module from public.modules where id = p_module_id for update;
  if not found then
    raise exception 'module not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_module.user_id);

  update public.modules set
    slug = btrim(p_slug),
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), '')
  where id = v_module.id
  returning * into v_module;
  return v_module;
end;
$$;
revoke all on function public.update_module(uuid, text, text, text) from public, anon;
grant execute on function public.update_module(uuid, text, text, text) to authenticated;

create or replace function public.move_module(p_module_id uuid, p_target_position integer)
returns public.modules
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_module public.modules;
  v_count integer;
  v_target integer;
begin
  select * into v_module from public.modules where id = p_module_id for update;
  if not found then
    raise exception 'module not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_module.user_id);
  if v_module.archived_at is not null then
    raise exception 'archived module cannot be reordered' using errcode = '23514';
  end if;

  perform 1 from public.modules
  where user_id = v_module.user_id and track_id = v_module.track_id and archived_at is null
  order by position
  for update;

  select count(*)::integer into v_count
  from public.modules
  where user_id = v_module.user_id and track_id = v_module.track_id
    and archived_at is null and id <> v_module.id;
  v_target := greatest(0, least(p_target_position, v_count));

  if v_target > v_module.position then
    update public.modules set position = position - 1
    where user_id = v_module.user_id and track_id = v_module.track_id and archived_at is null
      and id <> v_module.id and position > v_module.position and position <= v_target;
  elsif v_target < v_module.position then
    update public.modules set position = position + 1
    where user_id = v_module.user_id and track_id = v_module.track_id and archived_at is null
      and id <> v_module.id and position >= v_target and position < v_module.position;
  end if;

  update public.modules set position = v_target where id = v_module.id returning * into v_module;
  return v_module;
end;
$$;
revoke all on function public.move_module(uuid, integer) from public, anon;
grant execute on function public.move_module(uuid, integer) to authenticated;

-- --------------------------------------------------------------------------
-- Topics
-- --------------------------------------------------------------------------

create or replace function public.create_topic(
  p_module_id uuid,
  p_slug text,
  p_title text,
  p_description text default null,
  p_recommended_level text default null
)
returns public.topics
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_topic public.topics;
  v_position integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if btrim(coalesce(p_slug, '')) = '' or btrim(coalesce(p_title, '')) = '' then
    raise exception 'topic slug and title are required' using errcode = '22023';
  end if;

  perform 1 from public.modules where id = p_module_id;
  if not found then
    raise exception 'module not found' using errcode = 'P0002';
  end if;

  select count(*)::integer into v_position
  from public.topics
  where user_id = v_user_id and module_id = p_module_id and archived_at is null;

  insert into public.topics (user_id, module_id, slug, title, description, recommended_level, position)
  values (v_user_id, p_module_id, btrim(p_slug), btrim(p_title),
          nullif(btrim(coalesce(p_description, '')), ''),
          nullif(btrim(coalesce(p_recommended_level, '')), ''), v_position)
  returning * into v_topic;
  return v_topic;
end;
$$;
revoke all on function public.create_topic(uuid, text, text, text, text) from public, anon;
grant execute on function public.create_topic(uuid, text, text, text, text) to authenticated;

create or replace function public.update_topic(
  p_topic_id uuid,
  p_slug text,
  p_title text,
  p_description text default null,
  p_notes text default null,
  p_recommended_level text default null
)
returns public.topics
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_topic public.topics;
begin
  if btrim(coalesce(p_slug, '')) = '' or btrim(coalesce(p_title, '')) = '' then
    raise exception 'topic slug and title are required' using errcode = '22023';
  end if;

  select * into v_topic from public.topics where id = p_topic_id for update;
  if not found then
    raise exception 'topic not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_topic.user_id);

  update public.topics set
    slug = btrim(p_slug),
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    notes = nullif(btrim(coalesce(p_notes, '')), ''),
    recommended_level = nullif(btrim(coalesce(p_recommended_level, '')), '')
  where id = v_topic.id
  returning * into v_topic;
  return v_topic;
end;
$$;
revoke all on function public.update_topic(uuid, text, text, text, text, text) from public, anon;
grant execute on function public.update_topic(uuid, text, text, text, text, text) to authenticated;

create or replace function public.move_topic(p_topic_id uuid, p_target_position integer)
returns public.topics
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_topic public.topics;
  v_count integer;
  v_target integer;
begin
  select * into v_topic from public.topics where id = p_topic_id for update;
  if not found then
    raise exception 'topic not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_topic.user_id);
  if v_topic.archived_at is not null then
    raise exception 'archived topic cannot be reordered' using errcode = '23514';
  end if;

  perform 1 from public.topics
  where user_id = v_topic.user_id and module_id = v_topic.module_id and archived_at is null
  order by position
  for update;

  select count(*)::integer into v_count
  from public.topics
  where user_id = v_topic.user_id and module_id = v_topic.module_id
    and archived_at is null and id <> v_topic.id;
  v_target := greatest(0, least(p_target_position, v_count));

  if v_target > v_topic.position then
    update public.topics set position = position - 1
    where user_id = v_topic.user_id and module_id = v_topic.module_id and archived_at is null
      and id <> v_topic.id and position > v_topic.position and position <= v_target;
  elsif v_target < v_topic.position then
    update public.topics set position = position + 1
    where user_id = v_topic.user_id and module_id = v_topic.module_id and archived_at is null
      and id <> v_topic.id and position >= v_target and position < v_topic.position;
  end if;

  update public.topics set position = v_target where id = v_topic.id returning * into v_topic;
  return v_topic;
end;
$$;
revoke all on function public.move_topic(uuid, integer) from public, anon;
grant execute on function public.move_topic(uuid, integer) to authenticated;
