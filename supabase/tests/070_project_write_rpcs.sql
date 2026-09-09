begin;
select plan(13);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('40000000-0000-0000-0000-0000000000c1', 'authenticated', 'authenticated', 'pr21-a@example.invalid', '', now(), now(), now()),
  ('40000000-0000-0000-0000-0000000000c2', 'authenticated', 'authenticated', 'pr21-b@example.invalid', '', now(), now(), now());

set local role authenticated;
set local request.jwt.claim.sub = '40000000-0000-0000-0000-0000000000c1';

select public.create_project(
  'Alpha', 'short', 'full', null, null, null, 'in_progress', array['Postgres', 'dbt', 'Postgres']
);

select is((select count(*)::int from public.projects where name = 'Alpha'), 1, 'create_project inserts the project');
select is((select publication_status from public.projects where name = 'Alpha'), 'draft', 'create_project starts as draft');
select is(
  (select execution_status from public.projects where name = 'Alpha'),
  'in_progress',
  'create_project keeps the execution status'
);
select is(
  (
    select array_agg(t.name order by t.position)
    from public.project_technologies t
    join public.projects p on p.id = t.project_id
    where p.name = 'Alpha'
  ),
  array['Postgres', 'dbt'],
  'create_project stores deduped, ordered technologies'
);
select is(
  (
    select array_agg(t.position order by t.position)
    from public.project_technologies t
    join public.projects p on p.id = t.project_id
    where p.name = 'Alpha'
  ),
  array[0, 1],
  'create_project positions technologies densely from 0'
);

select set_config('pdi.test_project_id', (select id::text from public.projects where name = 'Alpha'), true);

select public.update_project(
  current_setting('pdi.test_project_id')::uuid,
  'Alpha edited', 'short2', 'full2', 'https://github.com/x/y', null, '2026-09-01', 'completed',
  array['Spark', 'Airflow', 'Postgres']
);

select is(
  (select name from public.projects where id = current_setting('pdi.test_project_id')::uuid),
  'Alpha edited',
  'update_project changes the name'
);
select is(
  (select execution_status from public.projects where id = current_setting('pdi.test_project_id')::uuid),
  'completed',
  'update_project changes the execution status'
);
select is(
  (
    select array_agg(name order by position)
    from public.project_technologies
    where project_id = current_setting('pdi.test_project_id')::uuid
  ),
  array['Spark', 'Airflow', 'Postgres'],
  'update_project replaces the whole technology set, ordered'
);

select public.archive_project(current_setting('pdi.test_project_id')::uuid);
select public.update_project(
  current_setting('pdi.test_project_id')::uuid,
  'Alpha edited', null, null, null, null, null, 'planned', array['Spark']
);
select is(
  (select execution_status from public.projects where id = current_setting('pdi.test_project_id')::uuid),
  'archived',
  'update_project does not move an archived project out of archived'
);

select throws_ok(
  $$ select public.create_project('Bad', null, null, null, null, null, 'shipping') $$,
  '22023', null,
  'create_project rejects an invalid execution status'
);

set local request.jwt.claim.sub = '40000000-0000-0000-0000-0000000000c2';
select throws_ok(
  format(
    $$ select public.update_project(%L::uuid, 'hijack', null, null, null, null, null, 'planned', array[]::text[]) $$,
    current_setting('pdi.test_project_id')
  ),
  'P0002', null,
  'update_project on another user''s project raises not found'
);

reset role;
select is(
  (select count(*)::int from pg_proc where proname in ('create_project', 'update_project') and pronamespace = 'public'::regnamespace and prosecdef),
  0,
  'project write RPCs are SECURITY INVOKER'
);
select ok(
  not has_function_privilege('anon', 'public.create_project(text,text,text,text,text,date,text,text[])', 'execute')
    and not has_function_privilege('anon', 'public.update_project(uuid,text,text,text,text,text,date,text,text[])', 'execute'),
  'anon cannot execute the project write RPCs'
);

select * from finish();
rollback;
