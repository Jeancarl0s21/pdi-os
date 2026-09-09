-- Performance hardening: avoid per-row re-evaluation of auth.uid() in RLS policies
-- (Supabase Performance Advisor: auth_rls_initplan). Wrapping auth.uid() as
-- (select auth.uid()) lets Postgres evaluate it once per query instead of once
-- per row. See architecture rule: RLS always uses (select auth.uid()).
--
-- Reconciliation: this exact change is already applied to Non-Prod (migration
-- version 20260901010446). Committing it so the repo matches the database and a
-- fresh `supabase db reset` produces the same policies. ALTER POLICY only
-- redefines the predicate expression, so re-running is safe and idempotent.

alter policy app_users_owner_select on public.app_users using (id = (select auth.uid()));
alter policy app_users_owner_update on public.app_users
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

do $$
declare
  t text;
begin
  foreach t in array array[
    'tracks','modules','topics','contents','activities','materials','projects','project_topics',
    'project_technologies','tasks','tags','task_tags','study_sessions','evidences',
    'career_entries','portfolio_links','stack_items','portfolio_profiles','portfolio_status'
  ]
  loop
    execute format(
      'alter policy %I on public.%I using (user_id = (select auth.uid()))',
      t || '_owner_select', t);
    execute format(
      'alter policy %I on public.%I with check (user_id = (select auth.uid()))',
      t || '_owner_insert', t);
    execute format(
      'alter policy %I on public.%I using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_owner_update', t);
    execute format(
      'alter policy %I on public.%I using (user_id = (select auth.uid()))',
      t || '_owner_delete', t);
  end loop;
end $$;
