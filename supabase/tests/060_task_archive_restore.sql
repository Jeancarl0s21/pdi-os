begin;
select plan(9);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('30000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'pr3-a@example.invalid', '', now(), now(), now()),
  ('30000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'pr3-b@example.invalid', '', now(), now(), now());

insert into public.tasks (id, user_id, title, status, position) values
  ('71000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000b1', 'A', 'backlog', 0),
  ('71000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-0000000000b1', 'B', 'backlog', 1),
  ('71000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-0000000000b1', 'C', 'backlog', 2);

set local role authenticated;
set local request.jwt.claim.sub = '30000000-0000-0000-0000-0000000000b1';

-- archive the middle task
select public.archive_task('71000000-0000-0000-0000-000000000002');

select is(
  (select archived_at is not null from public.tasks where id = '71000000-0000-0000-0000-000000000002'),
  true,
  'archive_task sets archived_at'
);
select is(
  (select position from public.tasks where id = '71000000-0000-0000-0000-000000000002'),
  null,
  'archive_task nulls the position'
);
select is(
  (select position from public.tasks where id = '71000000-0000-0000-0000-000000000003'),
  1,
  'archive_task compacts the source lane'
);
select is(
  (select count(*)::int from public.tasks where user_id = (select auth.uid()) and status = 'backlog' and archived_at is null),
  2,
  'archived task drops out of the active lane'
);

select throws_ok(
  $$ select public.update_task('71000000-0000-0000-0000-000000000002', 'edited', null, null, 'medium', 'backlog', null, array[]::text[]) $$,
  '23514', null,
  'update_task rejects an archived task'
);

-- restore appends to the end of the status lane
select public.restore_task('71000000-0000-0000-0000-000000000002');

select is(
  (select archived_at from public.tasks where id = '71000000-0000-0000-0000-000000000002'),
  null,
  'restore_task clears archived_at'
);
select is(
  (select position from public.tasks where id = '71000000-0000-0000-0000-000000000002'),
  2,
  'restore_task appends to the end of the lane'
);

-- cross-user isolation
set local request.jwt.claim.sub = '30000000-0000-0000-0000-0000000000b2';
select throws_ok(
  $$ select public.archive_task('71000000-0000-0000-0000-000000000001') $$,
  'P0002', null,
  'archive_task on another user''s task raises not found'
);
select throws_ok(
  $$ select public.restore_task('71000000-0000-0000-0000-000000000001') $$,
  'P0002', null,
  'restore_task on another user''s task raises not found'
);

select * from finish();
rollback;
