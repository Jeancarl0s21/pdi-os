-- PDI OS Slice 2 — transactional write RPCs for Projects.
-- SECURITY INVOKER (architecture rule 2): RLS on public.projects /
-- public.project_technologies still applies to the calling `authenticated` role.
-- They exist to keep project_technologies.position dense and the tech set sync
-- atomic. Style follows create_task / update_task (20260909024705).
--
-- Publication (publish/unpublish) and topic links are out of scope here.

create or replace function public.create_project(
  p_name text,
  p_short_description text default null,
  p_full_description text default null,
  p_github_url text default null,
  p_demo_url text default null,
  p_project_date date default null,
  p_execution_status text default 'planned',
  p_technologies text[] default '{}'
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_project public.projects;
  v_name text;
  v_position integer := 0;
  v_seen text[] := '{}';
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'project name is required' using errcode = '22023';
  end if;
  if p_execution_status not in ('planned', 'in_progress', 'completed') then
    raise exception 'invalid execution status' using errcode = '22023';
  end if;

  insert into public.projects (
    user_id, name, short_description, full_description, github_url, demo_url,
    project_date, execution_status
  )
  values (
    v_user_id, btrim(p_name),
    nullif(btrim(coalesce(p_short_description, '')), ''),
    nullif(btrim(coalesce(p_full_description, '')), ''),
    nullif(btrim(coalesce(p_github_url, '')), ''),
    nullif(btrim(coalesce(p_demo_url, '')), ''),
    p_project_date, p_execution_status
  )
  returning * into v_project;

  foreach v_name in array coalesce(p_technologies, '{}')
  loop
    v_name := btrim(v_name);
    continue when v_name = '';
    continue when lower(v_name) = any (v_seen);
    v_seen := v_seen || lower(v_name);
    insert into public.project_technologies (user_id, project_id, name, position)
    values (v_user_id, v_project.id, v_name, v_position);
    v_position := v_position + 1;
  end loop;

  return v_project;
end;
$$;

revoke all on function public.create_project(text, text, text, text, text, date, text, text[]) from public, anon;
grant execute on function public.create_project(text, text, text, text, text, date, text, text[]) to authenticated;

create or replace function public.update_project(
  p_project_id uuid,
  p_name text,
  p_short_description text default null,
  p_full_description text default null,
  p_github_url text default null,
  p_demo_url text default null,
  p_project_date date default null,
  p_execution_status text default 'planned',
  p_technologies text[] default '{}'
)
returns public.projects
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_project public.projects;
  v_name text;
  v_position integer := 0;
  v_seen text[] := '{}';
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if btrim(coalesce(p_name, '')) = '' then
    raise exception 'project name is required' using errcode = '22023';
  end if;
  if p_execution_status not in ('planned', 'in_progress', 'completed') then
    raise exception 'invalid execution status' using errcode = '22023';
  end if;

  select * into v_project from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'project not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_project.user_id);

  update public.projects set
    name = btrim(p_name),
    short_description = nullif(btrim(coalesce(p_short_description, '')), ''),
    full_description = nullif(btrim(coalesce(p_full_description, '')), ''),
    github_url = nullif(btrim(coalesce(p_github_url, '')), ''),
    demo_url = nullif(btrim(coalesce(p_demo_url, '')), ''),
    project_date = p_project_date,
    execution_status = case
      when v_project.execution_status = 'archived' then v_project.execution_status
      else p_execution_status
    end
  where id = v_project.id
  returning * into v_project;

  delete from public.project_technologies
  where user_id = v_user_id and project_id = v_project.id;

  foreach v_name in array coalesce(p_technologies, '{}')
  loop
    v_name := btrim(v_name);
    continue when v_name = '';
    continue when lower(v_name) = any (v_seen);
    v_seen := v_seen || lower(v_name);
    insert into public.project_technologies (user_id, project_id, name, position)
    values (v_user_id, v_project.id, v_name, v_position);
    v_position := v_position + 1;
  end loop;

  return v_project;
end;
$$;

revoke all on function public.update_project(uuid, text, text, text, text, text, date, text, text[]) from public, anon;
grant execute on function public.update_project(uuid, text, text, text, text, text, date, text, text[]) to authenticated;
