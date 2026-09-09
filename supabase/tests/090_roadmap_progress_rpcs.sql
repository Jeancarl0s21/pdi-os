begin;
select plan(13);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('60000000-0000-0000-0000-0000000000e1', 'authenticated', 'authenticated', 'pr3b-a@example.invalid', '', now(), now(), now()),
  ('60000000-0000-0000-0000-0000000000e2', 'authenticated', 'authenticated', 'pr3b-b@example.invalid', '', now(), now(), now());

set local role authenticated;
set local request.jwt.claim.sub = '60000000-0000-0000-0000-0000000000e1';

insert into public.tracks (user_id, slug, title)
values ((select auth.uid()), 'track-a', 'Track A');
insert into public.modules (user_id, track_id, slug, title, position)
values ((select auth.uid()), (select id from public.tracks where slug = 'track-a'), 'mod-a', 'Module A', 0);
insert into public.topics (user_id, module_id, slug, title, position)
values ((select auth.uid()), (select id from public.modules where slug = 'mod-a'), 'topic-a', 'Topic A', 0);

select set_config('pdi.topic', (select id::text from public.topics where slug = 'topic-a'), true);

insert into public.contents (user_id, topic_id, title, didactic_payload, position)
values ((select auth.uid()), current_setting('pdi.topic')::uuid, 'Content A', '{"explanation":"x"}'::jsonb, 0);
select set_config('pdi.content', (select id::text from public.contents where title = 'Content A'), true);

-- start_topic: not_started -> studying
select is(
  (select status from public.start_topic(current_setting('pdi.topic')::uuid)),
  'studying',
  'start_topic moves not_started to studying'
);
-- idempotent on an already-studying topic
select is(
  (select status from public.start_topic(current_setting('pdi.topic')::uuid)),
  'studying',
  'start_topic is a no-op once studying'
);

-- set_content_completed marks and clears completed_at
select isnt(
  (select completed_at from public.set_content_completed(current_setting('pdi.content')::uuid, true)),
  null,
  'set_content_completed(true) stamps completed_at'
);
select is(
  (select completed_at from public.set_content_completed(current_setting('pdi.content')::uuid, false)),
  null,
  'set_content_completed(false) clears completed_at'
);
-- completing a Content never completes the Topic (RN-CONTENT-003)
select public.set_content_completed(current_setting('pdi.content')::uuid, true);
select is(
  (select status from public.topics where id = current_setting('pdi.topic')::uuid),
  'studying',
  'completing a Content leaves the Topic status untouched'
);

-- archived topic cannot be started
insert into public.topics (user_id, module_id, slug, title, position)
values ((select auth.uid()), (select id from public.modules where slug = 'mod-a'), 'topic-arch', 'Topic Arch', 1);
select set_config('pdi.topic_arch', (select id::text from public.topics where slug = 'topic-arch'), true);
select public.archive_topic(current_setting('pdi.topic_arch')::uuid);
select throws_ok(
  format($$ select public.start_topic(%L::uuid) $$, current_setting('pdi.topic_arch')),
  '23514', null,
  'start_topic rejects an archived topic'
);

-- cross-user access raises not found
set local request.jwt.claim.sub = '60000000-0000-0000-0000-0000000000e2';
select throws_ok(
  format($$ select public.start_topic(%L::uuid) $$, current_setting('pdi.topic')),
  'P0002', null,
  'start_topic on another user''s topic raises not found'
);
select throws_ok(
  format($$ select public.set_content_completed(%L::uuid, true) $$, current_setting('pdi.content')),
  'P0002', null,
  'set_content_completed on another user''s content raises not found'
);

reset role;

select is(
  (select count(*)::int from pg_proc
    where proname in ('start_topic', 'set_content_completed')
    and pronamespace = 'public'::regnamespace and prosecdef),
  0,
  'the new roadmap RPCs are SECURITY INVOKER'
);
select ok(
  not has_function_privilege('anon', 'public.start_topic(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.set_content_completed(uuid,boolean)', 'execute'),
  'anon cannot execute the new roadmap RPCs'
);
select ok(
  has_function_privilege('authenticated', 'public.start_topic(uuid)', 'execute')
    and has_function_privilege('authenticated', 'public.set_content_completed(uuid,boolean)', 'execute'),
  'authenticated can execute the new roadmap RPCs'
);

-- start_topic returns the row unchanged for a completed topic (guarded by the
-- existing complete_topic invariant, exercised here only for the no-op path).
set local role authenticated;
set local request.jwt.claim.sub = '60000000-0000-0000-0000-0000000000e1';
insert into public.activities (user_id, topic_id, title, instruction, position, completed_at)
values ((select auth.uid()), current_setting('pdi.topic')::uuid, 'Act', 'do it', 0, now());
select public.complete_topic(current_setting('pdi.topic')::uuid);
select is(
  (select status from public.start_topic(current_setting('pdi.topic')::uuid)),
  'completed',
  'start_topic leaves a completed topic completed'
);

select is(
  (select status from public.topics where id = current_setting('pdi.topic')::uuid),
  'completed',
  'the topic is genuinely completed after complete_topic'
);

select * from finish();
rollback;
