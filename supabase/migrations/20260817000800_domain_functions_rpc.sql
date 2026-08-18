-- PDI OS Foundation — transactional domain invariants / RPC.

create or replace function public.assert_authenticated_owner(p_user_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_authenticated_owner(uuid) from public, anon;
grant execute on function public.assert_authenticated_owner(uuid) to authenticated;

create or replace function public.enforce_topic_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    if not exists (
      select 1 from public.activities a
      where a.user_id = new.user_id and a.topic_id = new.id and a.completed_at is not null
    ) then
      raise exception 'topic completion requires at least one completed activity' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger topics_enforce_completion
before update of status on public.topics
for each row execute function public.enforce_topic_completion();

create or replace function public.reconcile_topic_after_activity_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_topic_id uuid := coalesce(new.topic_id, old.topic_id);
begin
  if not exists (
    select 1 from public.activities a
    where a.user_id = v_user_id and a.topic_id = v_topic_id and a.completed_at is not null
  ) then
    update public.topics
       set status = 'studying'
     where id = v_topic_id
       and user_id = v_user_id
       and status = 'completed';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger activities_reconcile_topic_after_update
after update of completed_at on public.activities
for each row execute function public.reconcile_topic_after_activity_change();

create trigger activities_reconcile_topic_after_delete
after delete on public.activities
for each row execute function public.reconcile_topic_after_activity_change();

create or replace function public.complete_topic(p_topic_id uuid)
returns public.topics
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic public.topics;
begin
  select * into v_topic from public.topics where id = p_topic_id for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_topic.user_id);

  if not exists (
    select 1 from public.activities a
    where a.user_id = v_topic.user_id and a.topic_id = v_topic.id and a.completed_at is not null
  ) then
    raise exception 'topic completion requires at least one completed activity' using errcode = '23514';
  end if;

  update public.topics set status = 'completed' where id = v_topic.id returning * into v_topic;
  return v_topic;
end;
$$;
revoke all on function public.complete_topic(uuid) from public, anon;
grant execute on function public.complete_topic(uuid) to authenticated;

create or replace function public.set_activity_completed(p_activity_id uuid, p_completed boolean)
returns public.activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity public.activities;
begin
  select * into v_activity from public.activities where id = p_activity_id for update;
  if not found then raise exception 'activity not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_activity.user_id);

  update public.activities
     set completed_at = case when p_completed then coalesce(completed_at, now()) else null end
   where id = p_activity_id
   returning * into v_activity;
  return v_activity;
end;
$$;
revoke all on function public.set_activity_completed(uuid, boolean) from public, anon;
grant execute on function public.set_activity_completed(uuid, boolean) to authenticated;

create or replace function public.move_task(
  p_task_id uuid,
  p_target_status text,
  p_target_position integer
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_target_position integer;
  v_target_count integer;
begin
  if p_target_status not in ('backlog', 'in_progress', 'done') then
    raise exception 'invalid task status' using errcode = '22023';
  end if;

  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then raise exception 'task not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_task.user_id);
  if v_task.archived_at is not null then raise exception 'archived task cannot be reordered' using errcode = '23514'; end if;

  perform 1 from public.tasks
   where user_id = v_task.user_id and archived_at is null
     and status in (v_task.status, p_target_status)
   order by status, position
   for update;

  select count(*)::integer into v_target_count
  from public.tasks
  where user_id = v_task.user_id and archived_at is null and status = p_target_status
    and (p_target_status <> v_task.status or id <> v_task.id);

  v_target_position := greatest(0, least(p_target_position, v_target_count));

  if p_target_status = v_task.status then
    if v_target_position > v_task.position then
      update public.tasks set position = position - 1
       where user_id = v_task.user_id and archived_at is null and status = v_task.status
         and id <> v_task.id and position > v_task.position and position <= v_target_position;
    elsif v_target_position < v_task.position then
      update public.tasks set position = position + 1
       where user_id = v_task.user_id and archived_at is null and status = v_task.status
         and id <> v_task.id and position >= v_target_position and position < v_task.position;
    end if;
  else
    update public.tasks set position = position - 1
     where user_id = v_task.user_id and archived_at is null and status = v_task.status
       and id <> v_task.id and position > v_task.position;

    update public.tasks set position = position + 1
     where user_id = v_task.user_id and archived_at is null and status = p_target_status
       and position >= v_target_position;
  end if;

  update public.tasks
     set status = p_target_status, position = v_target_position
   where id = v_task.id
   returning * into v_task;
  return v_task;
end;
$$;
revoke all on function public.move_task(uuid, text, integer) from public, anon;
grant execute on function public.move_task(uuid, text, integer) to authenticated;

create or replace function public.archive_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then raise exception 'task not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_task.user_id);
  if v_task.archived_at is not null then return v_task; end if;

  perform 1 from public.tasks where user_id = v_task.user_id and status = v_task.status and archived_at is null for update;
  update public.tasks set position = position - 1
   where user_id = v_task.user_id and status = v_task.status and archived_at is null
     and id <> v_task.id and position > v_task.position;
  update public.tasks set archived_at = now(), position = null where id = v_task.id returning * into v_task;
  return v_task;
end;
$$;
revoke all on function public.archive_task(uuid) from public, anon;
grant execute on function public.archive_task(uuid) to authenticated;

create or replace function public.restore_task(p_task_id uuid)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_position integer;
begin
  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then raise exception 'task not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_task.user_id);
  if v_task.archived_at is null then return v_task; end if;

  select count(*)::integer into v_position from public.tasks
   where user_id = v_task.user_id and status = v_task.status and archived_at is null;
  update public.tasks set archived_at = null, position = v_position where id = v_task.id returning * into v_task;
  return v_task;
end;
$$;
revoke all on function public.restore_task(uuid) from public, anon;
grant execute on function public.restore_task(uuid) to authenticated;

create or replace function public.publish_project(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if not found then raise exception 'project not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_project.user_id);

  if btrim(v_project.name) = ''
     or nullif(btrim(coalesce(v_project.short_description, '')), '') is null
     or nullif(btrim(coalesce(v_project.full_description, '')), '') is null
     or nullif(btrim(coalesce(v_project.cover_path, '')), '') is null
     or not exists (select 1 from public.project_technologies t where t.project_id = v_project.id and t.user_id = v_project.user_id)
  then
    raise exception 'project is missing publication requirements' using errcode = '23514';
  end if;

  update public.projects set publication_status = 'published' where id = v_project.id returning * into v_project;
  return v_project;
end;
$$;
revoke all on function public.publish_project(uuid) from public, anon;
grant execute on function public.publish_project(uuid) to authenticated;

create or replace function public.unpublish_project(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare v_project public.projects;
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if not found then raise exception 'project not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_project.user_id);
  update public.projects set publication_status = 'draft' where id = v_project.id returning * into v_project;
  return v_project;
end;
$$;
revoke all on function public.unpublish_project(uuid) from public, anon;
grant execute on function public.unpublish_project(uuid) to authenticated;

create or replace function public.archive_project(p_project_id uuid)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare v_project public.projects;
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if not found then raise exception 'project not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_project.user_id);
  update public.projects set execution_status = 'archived' where id = v_project.id returning * into v_project;
  return v_project;
end;
$$;
revoke all on function public.archive_project(uuid) from public, anon;
grant execute on function public.archive_project(uuid) to authenticated;

create or replace function public.restore_project(p_project_id uuid, p_execution_status text)
returns public.projects
language plpgsql
security definer
set search_path = ''
as $$
declare v_project public.projects;
begin
  if p_execution_status not in ('planned', 'in_progress', 'completed') then
    raise exception 'restore target must be an active execution status' using errcode = '22023';
  end if;
  select * into v_project from public.projects where id = p_project_id for update;
  if not found then raise exception 'project not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_project.user_id);
  update public.projects set execution_status = p_execution_status where id = v_project.id returning * into v_project;
  return v_project;
end;
$$;
revoke all on function public.restore_project(uuid, text) from public, anon;
grant execute on function public.restore_project(uuid, text) to authenticated;

-- Direct draft -> published updates must obey the same atomic publication invariant as the RPC.
create or replace function public.enforce_project_publication()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.publication_status = 'published' and old.publication_status is distinct from 'published' then
    if nullif(btrim(coalesce(new.short_description, '')), '') is null
       or nullif(btrim(coalesce(new.full_description, '')), '') is null
       or nullif(btrim(coalesce(new.cover_path, '')), '') is null
       or not exists (
         select 1 from public.project_technologies t
         where t.user_id = new.user_id and t.project_id = new.id
       )
    then
      raise exception 'project is missing publication requirements' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create trigger projects_enforce_publication
before update of publication_status on public.projects
for each row execute function public.enforce_project_publication();

create or replace function public.archive_module(p_module_id uuid)
returns public.modules
language plpgsql
security definer
set search_path = ''
as $$
declare v_row public.modules;
begin
  select * into v_row from public.modules where id = p_module_id for update;
  if not found then raise exception 'module not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_row.user_id);
  if v_row.archived_at is not null then return v_row; end if;
  perform 1 from public.modules where user_id = v_row.user_id and track_id = v_row.track_id and archived_at is null for update;
  update public.modules set position = position - 1
    where user_id = v_row.user_id and track_id = v_row.track_id and archived_at is null
      and id <> v_row.id and position > v_row.position;
  update public.modules set archived_at = now(), position = null where id = v_row.id returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.archive_module(uuid) from public, anon;
grant execute on function public.archive_module(uuid) to authenticated;

create or replace function public.restore_module(p_module_id uuid)
returns public.modules
language plpgsql
security definer
set search_path = ''
as $$
declare v_row public.modules; v_position integer;
begin
  select * into v_row from public.modules where id = p_module_id for update;
  if not found then raise exception 'module not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_row.user_id);
  if v_row.archived_at is null then return v_row; end if;
  select count(*)::integer into v_position from public.modules
    where user_id = v_row.user_id and track_id = v_row.track_id and archived_at is null;
  update public.modules set archived_at = null, position = v_position where id = v_row.id returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.restore_module(uuid) from public, anon;
grant execute on function public.restore_module(uuid) to authenticated;

create or replace function public.archive_topic(p_topic_id uuid)
returns public.topics
language plpgsql
security definer
set search_path = ''
as $$
declare v_row public.topics;
begin
  select * into v_row from public.topics where id = p_topic_id for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_row.user_id);
  if v_row.archived_at is not null then return v_row; end if;
  perform 1 from public.topics where user_id = v_row.user_id and module_id = v_row.module_id and archived_at is null for update;
  update public.topics set position = position - 1
    where user_id = v_row.user_id and module_id = v_row.module_id and archived_at is null
      and id <> v_row.id and position > v_row.position;
  update public.topics set archived_at = now(), position = null where id = v_row.id returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.archive_topic(uuid) from public, anon;
grant execute on function public.archive_topic(uuid) to authenticated;

create or replace function public.restore_topic(p_topic_id uuid)
returns public.topics
language plpgsql
security definer
set search_path = ''
as $$
declare v_row public.topics; v_position integer;
begin
  select * into v_row from public.topics where id = p_topic_id for update;
  if not found then raise exception 'topic not found' using errcode = 'P0002'; end if;
  perform public.assert_authenticated_owner(v_row.user_id);
  if v_row.archived_at is null then return v_row; end if;
  select count(*)::integer into v_position from public.topics
    where user_id = v_row.user_id and module_id = v_row.module_id and archived_at is null;
  update public.topics set archived_at = null, position = v_position where id = v_row.id returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.restore_topic(uuid) from public, anon;
grant execute on function public.restore_topic(uuid) to authenticated;

-- Seed-derived hard deletes persist importer memory automatically.
create or replace function public.remember_seed_entity_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.source_key is not null then
    insert into public.seed_tombstones(user_id, entity_type, source_key)
    values (old.user_id, tg_table_name, old.source_key)
    on conflict (user_id, entity_type, source_key)
    do update set deleted_at = excluded.deleted_at;
  end if;
  return old;
end;
$$;

create trigger contents_seed_tombstone before delete on public.contents
for each row execute function public.remember_seed_entity_delete();
create trigger activities_seed_tombstone before delete on public.activities
for each row execute function public.remember_seed_entity_delete();
create trigger materials_seed_tombstone before delete on public.materials
for each row execute function public.remember_seed_entity_delete();

create or replace function public.remember_seed_project_topic_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare v_project_key text; v_topic_key text;
begin
  select source_key into v_project_key from public.projects where id = old.project_id and user_id = old.user_id;
  select source_key into v_topic_key from public.topics where id = old.topic_id and user_id = old.user_id;
  if v_project_key is not null and v_topic_key is not null then
    insert into public.seed_tombstones(user_id, entity_type, source_key)
    values (old.user_id, 'project_topics', 'PTMAP:' || v_project_key || ':' || v_topic_key)
    on conflict (user_id, entity_type, source_key)
    do update set deleted_at = excluded.deleted_at;
  end if;
  return old;
end;
$$;

create trigger project_topics_seed_tombstone before delete on public.project_topics
for each row execute function public.remember_seed_project_topic_delete();
