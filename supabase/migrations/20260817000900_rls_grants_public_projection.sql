-- PDI OS Foundation — deny-by-default RLS and least-privilege table grants.
-- Public Portfolio DTOs remain a server/application projection; anon gets no raw domain-table SELECT.

alter table public.app_users enable row level security;
alter table public.tracks enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.contents enable row level security;
alter table public.activities enable row level security;
alter table public.materials enable row level security;
alter table public.projects enable row level security;
alter table public.project_topics enable row level security;
alter table public.project_technologies enable row level security;
alter table public.tasks enable row level security;
alter table public.tags enable row level security;
alter table public.task_tags enable row level security;
alter table public.study_sessions enable row level security;
alter table public.evidences enable row level security;
alter table public.portfolio_profiles enable row level security;
alter table public.career_entries enable row level security;
alter table public.portfolio_links enable row level security;
alter table public.stack_items enable row level security;
alter table public.portfolio_status enable row level security;
alter table public.seed_import_runs enable row level security;
alter table public.seed_tombstones enable row level security;

revoke all on all tables in schema public from anon;
revoke all on public.seed_import_runs, public.seed_tombstones from authenticated;

grant select, update on public.app_users to authenticated;
grant select, insert, update, delete on
  public.tracks, public.modules, public.topics, public.contents, public.activities, public.materials,
  public.projects, public.project_topics, public.project_technologies,
  public.tasks, public.tags, public.task_tags, public.study_sessions, public.evidences,
  public.portfolio_profiles, public.career_entries, public.portfolio_links, public.stack_items, public.portfolio_status
  to authenticated;

create policy app_users_owner_select on public.app_users for select to authenticated using (id = auth.uid());
create policy app_users_owner_update on public.app_users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Tables with user_id ownership use the same explicit CRUD boundary.
do $$
declare
  t text;
begin
  foreach t in array array[
    'tracks','modules','topics','contents','activities','materials','projects','project_topics',
    'project_technologies','tasks','tags','task_tags','study_sessions','evidences',
    'career_entries','portfolio_links','stack_items'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid())', t || '_owner_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())', t || '_owner_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_owner_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())', t || '_owner_delete', t);
  end loop;
end $$;

create policy portfolio_profiles_owner_select on public.portfolio_profiles for select to authenticated using (user_id = auth.uid());
create policy portfolio_profiles_owner_insert on public.portfolio_profiles for insert to authenticated with check (user_id = auth.uid());
create policy portfolio_profiles_owner_update on public.portfolio_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy portfolio_profiles_owner_delete on public.portfolio_profiles for delete to authenticated using (user_id = auth.uid());

create policy portfolio_status_owner_select on public.portfolio_status for select to authenticated using (user_id = auth.uid());
create policy portfolio_status_owner_insert on public.portfolio_status for insert to authenticated with check (user_id = auth.uid());
create policy portfolio_status_owner_update on public.portfolio_status for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy portfolio_status_owner_delete on public.portfolio_status for delete to authenticated using (user_id = auth.uid());

-- Operational Seed tables are intentionally inaccessible from normal authenticated web requests.
-- Admin importer uses the isolated database/admin boundary, never the normal request path.
