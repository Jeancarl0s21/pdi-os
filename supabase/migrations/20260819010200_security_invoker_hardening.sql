-- PDI OS Foundation — security hardening discovered during Non-Prod validation.
-- Architecture Master V1.0 requires critical multi-row RPCs to use SECURITY INVOKER by default.
-- Trigger-only helpers that legitimately require SECURITY DEFINER remain definer, but are not callable as RPCs.

alter function public.assert_authenticated_owner(uuid) security invoker;
alter function public.complete_topic(uuid) security invoker;
alter function public.set_activity_completed(uuid, boolean) security invoker;
alter function public.move_task(uuid, text, integer) security invoker;
alter function public.archive_task(uuid) security invoker;
alter function public.restore_task(uuid) security invoker;
alter function public.publish_project(uuid) security invoker;
alter function public.unpublish_project(uuid) security invoker;
alter function public.archive_project(uuid) security invoker;
alter function public.restore_project(uuid, text) security invoker;
alter function public.archive_module(uuid) security invoker;
alter function public.restore_module(uuid) security invoker;
alter function public.archive_topic(uuid) security invoker;
alter function public.restore_topic(uuid) security invoker;

-- These are trigger-only maintenance helpers. They need elevated rights for auth provisioning
-- or writes to operational tables that normal authenticated web requests cannot access.
revoke all on function public.handle_auth_user_created() from public, anon, authenticated;
revoke all on function public.remember_seed_entity_delete() from public, anon, authenticated;
revoke all on function public.remember_seed_project_topic_delete() from public, anon, authenticated;
