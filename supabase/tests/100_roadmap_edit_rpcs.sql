begin;
select plan(15);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('70000000-0000-0000-0000-0000000000f1', 'authenticated', 'authenticated', 'pr3c-a@example.invalid', '', now(), now(), now()),
  ('70000000-0000-0000-0000-0000000000f2', 'authenticated', 'authenticated', 'pr3c-b@example.invalid', '', now(), now(), now());

set local role authenticated;
set local request.jwt.claim.sub = '70000000-0000-0000-0000-0000000000f1';

insert into public.tracks (user_id, slug, title) values ((select auth.uid()), 'trk', 'Track');
select set_config('pdi.track', (select id::text from public.tracks where slug = 'trk'), true);

-- create_module appends densely from 0
select is(
  (select position from public.create_module(current_setting('pdi.track')::uuid, 'm-a', 'Module A')),
  0,
  'first create_module lands at position 0'
);
select is(
  (select position from public.create_module(current_setting('pdi.track')::uuid, 'm-b', 'Module B')),
  1,
  'second create_module lands at position 1'
);
select is(
  (select position from public.create_module(current_setting('pdi.track')::uuid, 'm-c', 'Module C')),
  2,
  'third create_module lands at position 2'
);

select set_config('pdi.m_a', (select id::text from public.modules where slug = 'm-a'), true);
select set_config('pdi.m_c', (select id::text from public.modules where slug = 'm-c'), true);

select is(
  (select title from public.update_module(current_setting('pdi.m_a')::uuid, 'm-a', 'Module A edit')),
  'Module A edit',
  'update_module changes the title'
);

-- move C to the front; A and B shift right
select public.move_module(current_setting('pdi.m_c')::uuid, 0);
select is(
  (select array_agg(slug order by position) from public.modules where track_id = current_setting('pdi.track')::uuid),
  array['m-c', 'm-a', 'm-b'],
  'move_module reorders and keeps positions dense'
);
select is(
  (select array_agg(position order by position) from public.modules where track_id = current_setting('pdi.track')::uuid),
  array[0, 1, 2],
  'positions stay 0..n after a move'
);

-- Topics under Module A
select set_config('pdi.mod', current_setting('pdi.m_a'), true);
select is(
  (select position from public.create_topic(current_setting('pdi.mod')::uuid, 't-a', 'Topic A')),
  0,
  'first create_topic lands at position 0'
);
select public.create_topic(current_setting('pdi.mod')::uuid, 't-b', 'Topic B');
select public.create_topic(current_setting('pdi.mod')::uuid, 't-c', 'Topic C');
select set_config('pdi.t_a', (select id::text from public.topics where slug = 't-a'), true);

select public.move_topic(current_setting('pdi.t_a')::uuid, 2);
select is(
  (select array_agg(slug order by position) from public.topics where module_id = current_setting('pdi.mod')::uuid),
  array['t-b', 't-c', 't-a'],
  'move_topic reorders to the end'
);

select is(
  (select notes from public.update_topic(current_setting('pdi.t_a')::uuid, 't-a', 'Topic A', null, 'my note')),
  'my note',
  'update_topic sets notes'
);

-- Validation
select throws_ok(
  format($$ select public.create_module(%L::uuid, '', 'x') $$, current_setting('pdi.track')),
  '22023', null,
  'create_module rejects an empty slug'
);
select throws_ok(
  $$ select public.create_topic('00000000-0000-0000-0000-000000000000'::uuid, 't', 'T') $$,
  'P0002', null,
  'create_topic rejects an unknown module'
);

-- Cross-user
set local request.jwt.claim.sub = '70000000-0000-0000-0000-0000000000f2';
select throws_ok(
  format($$ select public.update_module(%L::uuid, 'x', 'x') $$, current_setting('pdi.m_a')),
  'P0002', null,
  'update_module on another user''s module raises not found'
);
select throws_ok(
  format($$ select public.move_topic(%L::uuid, 0) $$, current_setting('pdi.t_a')),
  'P0002', null,
  'move_topic on another user''s topic raises not found'
);

reset role;
select is(
  (select count(*)::int from pg_proc
    where proname in ('create_module','update_module','move_module','create_topic','update_topic','move_topic')
    and pronamespace = 'public'::regnamespace and prosecdef),
  0,
  'the roadmap edit RPCs are all SECURITY INVOKER'
);
select ok(
  not has_function_privilege('anon', 'public.create_module(uuid,text,text,text)', 'execute')
    and not has_function_privilege('anon', 'public.move_topic(uuid,integer)', 'execute'),
  'anon cannot execute the roadmap edit RPCs'
);

select * from finish();
rollback;
