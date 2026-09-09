begin;
select plan(15);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('20000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'pr1-a@example.invalid', '', now(), now(), now()),
  ('20000000-0000-0000-0000-0000000000a2', 'authenticated', 'authenticated', 'pr1-b@example.invalid', '', now(), now(), now());

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-0000-0000-0000000000a1';

-- create_task: dense positions per status lane
select public.create_task('First');
select public.create_task('Second');
select public.create_task('Tagged', 'a description', 'study', 'high', 'backlog', null, array['Focus', 'deep-work', 'Focus']);

select is((select position from public.tasks where title = 'First'), 0, 'create_task: first backlog task at position 0');
select is((select position from public.tasks where title = 'Second'), 1, 'create_task: second backlog task at position 1');
select is((select position from public.tasks where title = 'Tagged'), 2, 'create_task: third backlog task at position 2');
select is((select description from public.tasks where title = 'Tagged'), 'a description', 'create_task stores description');

select is(
  (select count(*)::int from public.tags where user_id = (select auth.uid()) and lower(name) = any (array['focus', 'deep-work'])),
  2,
  'create_task upserts tags case-insensitively and de-duplicated'
);
select is(
  (select count(*)::int from public.task_tags tt join public.tasks t on t.id = tt.task_id where t.title = 'Tagged'),
  2,
  'create_task links task_tags'
);

-- capture an id for the later cross-user check while still authenticated as user A
select set_config('pdi.test_first_id', (select id::text from public.tasks where title = 'First'), true);

-- update_task: title + status change repositions both lanes
select public.update_task(
  (select id from public.tasks where title = 'Second'),
  'Second edited', null, null, 'medium', 'done', null, array[]::text[]
);
select is((select title from public.tasks where title = 'Second edited'), 'Second edited', 'update_task changes title');
select is((select status from public.tasks where title = 'Second edited'), 'done', 'update_task changes status');
select is((select position from public.tasks where title = 'Second edited'), 0, 'update_task: moved task appended to target lane');
select is((select position from public.tasks where title = 'Tagged'), 1, 'update_task: source lane gap is closed');

-- update_task replaces the full tag set
select public.update_task(
  (select id from public.tasks where title = 'Tagged'),
  'Tagged', null, null, 'high', 'backlog', null, array['solo-tag']
);
select is(
  (select count(*)::int from public.task_tags tt join public.tasks t on t.id = tt.task_id where t.title = 'Tagged'),
  1,
  'update_task replaces the tag set'
);

-- invalid vocabulary is rejected with a predictable errcode
select throws_ok(
  $$ select public.create_task('Bad', null, null, 'urgent') $$,
  '22023', null,
  'create_task rejects an invalid priority'
);

-- cross-user isolation: user B cannot touch user A's task
set local request.jwt.claim.sub = '20000000-0000-0000-0000-0000000000a2';
select throws_ok(
  format($$ select public.update_task(%L::uuid, 'hijack', null, null, 'low', 'backlog', null, array[]::text[]) $$, current_setting('pdi.test_first_id')),
  'P0002', null,
  'update_task on another user''s task raises not found'
);

-- security posture
reset role;
select is(
  (select count(*)::int from pg_proc where proname in ('create_task', 'update_task') and pronamespace = 'public'::regnamespace and prosecdef),
  0,
  'task write RPCs are SECURITY INVOKER'
);
select ok(
  not has_function_privilege('anon', 'public.create_task(text,text,text,text,text,date,text[])', 'execute')
    and not has_function_privilege('anon', 'public.update_task(uuid,text,text,text,text,text,date,text[])', 'execute'),
  'anon cannot execute the task write RPCs'
);

select * from finish();
rollback;
