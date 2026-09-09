begin;
select plan(12);

-- The single MVP account (PRD §4.1).
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('50000000-0000-0000-0000-0000000000d1', 'authenticated', 'authenticated', 'pr3@example.invalid', '', now(), now(), now());

set local role authenticated;
set local request.jwt.claim.sub = '50000000-0000-0000-0000-0000000000d1';

insert into public.portfolio_profiles (user_id, name, headline, intro, about)
values ((select auth.uid()), 'Jean', 'Data Engineer', 'intro text', 'about text');

insert into public.portfolio_links (user_id, type, label, href, position)
values ((select auth.uid()), 'github', 'GitHub', 'https://github.com/x', 0),
       ((select auth.uid()), 'linkedin', 'LinkedIn', 'https://linkedin.com/in/x', 1);

insert into public.stack_items (user_id, name, group_name, is_featured, position)
values ((select auth.uid()), 'Postgres', 'Data', true, 0),
       ((select auth.uid()), 'dbt', 'Data', false, 1);

select public.create_project(
  'Published One', 'short pub', 'full pub', 'https://github.com/x/pub', null, '2026-08-01', 'completed',
  array['Spark', 'Airflow']
);
select public.create_project(
  'Secret Draft', 'short draft', 'full draft', null, null, null, 'planned', array['Terraform']
);

select set_config('pdi.pub_id', (select id::text from public.projects where name = 'Published One'), true);
select set_config('pdi.draft_id', (select id::text from public.projects where name = 'Secret Draft'), true);

-- publish_project requires a cover_path; set it via the owner RLS update, then publish.
update public.projects set cover_path = current_setting('pdi.pub_id') || '/cover'
where id = current_setting('pdi.pub_id')::uuid;
select public.publish_project(current_setting('pdi.pub_id')::uuid);

reset role;
set local role anon;

-- Regression: the anonymous visitor still has no raw read on any domain table.
select throws_ok(
  $$ select count(*) from public.projects $$, '42501', null,
  'anon cannot SELECT public.projects'
);
select throws_ok(
  $$ select count(*) from public.portfolio_profiles $$, '42501', null,
  'anon cannot SELECT public.portfolio_profiles'
);
select throws_ok(
  $$ select count(*) from public.stack_items $$, '42501', null,
  'anon cannot SELECT public.stack_items'
);

-- The DTO RPC is the one thing anon may call.
select set_config('pdi.dto', (select public.get_public_portfolio())::text, true);

select is(
  current_setting('pdi.dto')::json -> 'profile' ->> 'name',
  'Jean',
  'get_public_portfolio exposes the public profile name'
);
select is(
  (select count(*)::int from json_array_elements(current_setting('pdi.dto')::json -> 'projects')),
  1,
  'get_public_portfolio exposes only the published project'
);
select is(
  current_setting('pdi.dto')::json -> 'projects' -> 0 ->> 'name',
  'Published One',
  'the published project is the one exposed'
);
select is(
  (
    select count(*)::int
    from json_array_elements(current_setting('pdi.dto')::json -> 'projects') e
    where e ->> 'id' = current_setting('pdi.draft_id')
  ),
  0,
  'the draft project id never appears in the public DTO'
);
select is(
  (
    select string_agg(value, ',')
    from json_array_elements_text(current_setting('pdi.dto')::json -> 'projects' -> 0 -> 'technologies')
  ),
  'Spark,Airflow',
  'project technologies come back ordered by position'
);
select is(
  (select count(*)::int from json_array_elements(current_setting('pdi.dto')::json -> 'links')),
  2,
  'get_public_portfolio exposes the profile links'
);
select is(
  (select count(*)::int from json_array_elements(current_setting('pdi.dto')::json -> 'stack')),
  2,
  'get_public_portfolio exposes the stack items'
);

reset role;

select is(
  (select prosecdef from pg_proc where proname = 'get_public_portfolio' and pronamespace = 'public'::regnamespace),
  true,
  'get_public_portfolio is SECURITY DEFINER by design'
);
select ok(
  has_function_privilege('anon', 'public.get_public_portfolio()', 'execute'),
  'anon may execute get_public_portfolio'
);

select * from finish();
rollback;
