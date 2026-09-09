-- PDI OS Slice 1 — transactional write RPCs for Tasks.
-- SECURITY INVOKER (architecture rule 2): RLS on public.tasks / public.tags /
-- public.task_tags still applies to the calling `authenticated` role. These
-- functions exist only to keep `position` dense and tag sync atomic; they are
-- not a privilege boundary. Style follows move_task / archive_task in
-- 20260817000800_domain_functions_rpc.sql.

create or replace function public.create_task(
  p_title text,
  p_description text default null,
  p_category text default null,
  p_priority text default 'medium',
  p_status text default 'backlog',
  p_due_date date default null,
  p_tag_names text[] default '{}'
)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_task public.tasks;
  v_position integer;
  v_name text;
  v_tag_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'title is required' using errcode = '22023';
  end if;
  if p_priority not in ('low', 'medium', 'high') then
    raise exception 'invalid task priority' using errcode = '22023';
  end if;
  if p_status not in ('backlog', 'in_progress', 'done') then
    raise exception 'invalid task status' using errcode = '22023';
  end if;
  if p_category is not null and p_category not in ('work', 'study', 'project', 'personal') then
    raise exception 'invalid task category' using errcode = '22023';
  end if;

  select count(*)::integer into v_position
  from public.tasks
  where user_id = v_user_id and archived_at is null and status = p_status;

  insert into public.tasks (
    user_id, title, description, category, priority, status, due_date, position
  )
  values (
    v_user_id, btrim(p_title), nullif(btrim(coalesce(p_description, '')), ''),
    p_category, p_priority, p_status, p_due_date, v_position
  )
  returning * into v_task;

  foreach v_name in array coalesce(p_tag_names, '{}')
  loop
    v_name := btrim(v_name);
    continue when v_name = '';
    insert into public.tags (user_id, name) values (v_user_id, v_name)
      on conflict do nothing;
    select id into v_tag_id from public.tags
      where user_id = v_user_id and lower(name) = lower(v_name);
    insert into public.task_tags (user_id, task_id, tag_id)
      values (v_user_id, v_task.id, v_tag_id)
      on conflict do nothing;
  end loop;

  return v_task;
end;
$$;

revoke all on function public.create_task(text, text, text, text, text, date, text[]) from public, anon;
grant execute on function public.create_task(text, text, text, text, text, date, text[]) to authenticated;

create or replace function public.update_task(
  p_task_id uuid,
  p_title text,
  p_description text default null,
  p_category text default null,
  p_priority text default 'medium',
  p_status text default 'backlog',
  p_due_date date default null,
  p_tag_names text[] default '{}'
)
returns public.tasks
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_task public.tasks;
  v_new_position integer;
  v_name text;
  v_tag_id uuid;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if btrim(coalesce(p_title, '')) = '' then
    raise exception 'title is required' using errcode = '22023';
  end if;
  if p_priority not in ('low', 'medium', 'high') then
    raise exception 'invalid task priority' using errcode = '22023';
  end if;
  if p_status not in ('backlog', 'in_progress', 'done') then
    raise exception 'invalid task status' using errcode = '22023';
  end if;
  if p_category is not null and p_category not in ('work', 'study', 'project', 'personal') then
    raise exception 'invalid task category' using errcode = '22023';
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'task not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_task.user_id);
  if v_task.archived_at is not null then
    raise exception 'archived task cannot be edited' using errcode = '23514';
  end if;

  if p_status <> v_task.status then
    -- close the gap left in the current lane
    perform 1 from public.tasks
      where user_id = v_user_id and archived_at is null and status = v_task.status
      for update;
    update public.tasks set position = position - 1
      where user_id = v_user_id and archived_at is null and status = v_task.status
        and id <> v_task.id and position > v_task.position;
    -- append to the end of the target lane
    select count(*)::integer into v_new_position from public.tasks
      where user_id = v_user_id and archived_at is null and status = p_status
        and id <> v_task.id;
  else
    v_new_position := v_task.position;
  end if;

  update public.tasks set
    title = btrim(p_title),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    category = p_category,
    priority = p_priority,
    status = p_status,
    due_date = p_due_date,
    position = v_new_position
  where id = v_task.id
  returning * into v_task;

  -- replace the full tag set
  delete from public.task_tags where user_id = v_user_id and task_id = v_task.id;
  foreach v_name in array coalesce(p_tag_names, '{}')
  loop
    v_name := btrim(v_name);
    continue when v_name = '';
    insert into public.tags (user_id, name) values (v_user_id, v_name)
      on conflict do nothing;
    select id into v_tag_id from public.tags
      where user_id = v_user_id and lower(name) = lower(v_name);
    insert into public.task_tags (user_id, task_id, tag_id)
      values (v_user_id, v_task.id, v_tag_id)
      on conflict do nothing;
  end loop;

  return v_task;
end;
$$;

revoke all on function public.update_task(uuid, text, text, text, text, text, date, text[]) from public, anon;
grant execute on function public.update_task(uuid, text, text, text, text, text, date, text[]) to authenticated;
