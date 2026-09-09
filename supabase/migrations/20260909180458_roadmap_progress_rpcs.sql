-- PDI OS Slice 3 · PR-2 — Topic progress write RPCs.
-- SECURITY INVOKER (architecture rule 2): the RLS owner policies on
-- public.topics / public.contents apply to the calling `authenticated` role.
-- Topic completion (complete_topic), activity toggling (set_activity_completed)
-- and the auto-revert trigger (reconcile_topic_after_activity_change) already
-- exist from the Foundation; these two fill the gaps: starting a Topic and
-- toggling a Content's completion. Style follows create_task / update_task
-- (20260909024705).

create or replace function public.start_topic(p_topic_id uuid)
returns public.topics
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_topic public.topics;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_topic from public.topics where id = p_topic_id for update;
  if not found then
    raise exception 'topic not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_topic.user_id);

  if v_topic.archived_at is not null then
    raise exception 'archived topic cannot be started' using errcode = '23514';
  end if;

  -- Only not_started -> studying. studying / completed are left untouched
  -- (completion is complete_topic; reopening is the activity trigger's job).
  if v_topic.status = 'not_started' then
    update public.topics set status = 'studying' where id = v_topic.id returning * into v_topic;
  end if;
  return v_topic;
end;
$$;
revoke all on function public.start_topic(uuid) from public, anon;
grant execute on function public.start_topic(uuid) to authenticated;

create or replace function public.set_content_completed(p_content_id uuid, p_completed boolean)
returns public.contents
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_content public.contents;
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into v_content from public.contents where id = p_content_id for update;
  if not found then
    raise exception 'content not found' using errcode = 'P0002';
  end if;
  perform public.assert_authenticated_owner(v_content.user_id);

  -- Completing a Content never completes the Topic (RN-CONTENT-003 / AMD-001).
  update public.contents
     set completed_at = case when p_completed then coalesce(completed_at, now()) else null end
   where id = v_content.id
   returning * into v_content;
  return v_content;
end;
$$;
revoke all on function public.set_content_completed(uuid, boolean) from public, anon;
grant execute on function public.set_content_completed(uuid, boolean) to authenticated;
