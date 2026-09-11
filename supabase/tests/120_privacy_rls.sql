-- BKL-REL-03: regression guard that the Slice 3/4 tables written via direct
-- RLS (no RPC) stay deny-by-default for anon and owner-isolated for authenticated.
begin;
select plan(19);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('90000000-0000-0000-0000-0000000000b1', 'authenticated', 'authenticated', 'priv-a@example.invalid', '', now(), now(), now()),
  ('90000000-0000-0000-0000-0000000000b2', 'authenticated', 'authenticated', 'priv-b@example.invalid', '', now(), now(), now());

-- ---- User A seeds one row in each table ---------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-0000-0000-0000000000b1';

insert into public.portfolio_profiles (user_id, name) values ((select auth.uid()), 'A');
insert into public.portfolio_status (user_id, role) values ((select auth.uid()), 'DE');
insert into public.portfolio_links (user_id, label, href, position)
values ((select auth.uid()), 'GitHub', 'https://github.com/a', 0);
insert into public.stack_items (user_id, name, position)
values ((select auth.uid()), 'Postgres', 0);
insert into public.career_entries (user_id, title, position)
values ((select auth.uid()), 'Analyst', 0);
insert into public.study_sessions (user_id, studied_on, title)
values ((select auth.uid()), '2026-09-01', 'Sessão A');

insert into public.tracks (user_id, slug, title) values ((select auth.uid()), 't', 'T');
insert into public.modules (user_id, track_id, slug, title, position)
values ((select auth.uid()), (select id from public.tracks where slug = 't'), 'm', 'M', 0);
insert into public.topics (user_id, module_id, slug, title, position)
values ((select auth.uid()), (select id from public.modules where slug = 'm'), 'tp', 'TP', 0);
insert into public.activities (user_id, topic_id, title, instruction, position)
values ((select auth.uid()), (select id from public.topics where slug = 'tp'), 'Act', 'do it', 0);
insert into public.evidences (user_id, activity_id, kind, external_url)
values ((select auth.uid()), (select id from public.activities where title = 'Act'), 'link', 'https://ex.com/e');

-- ---- Evidence table CHECK constraints ---------------------------------------
select throws_ok(
  $$ insert into public.evidences (user_id, kind, external_url)
     values ((select auth.uid()), 'link', 'https://ex.com/x') $$,
  '23514', null,
  'evidence must reference exactly one context (activity XOR study_session)'
);
select throws_ok(
  $$ insert into public.evidences (user_id, study_session_id, kind, external_url, storage_path)
     values ((select auth.uid()),
             (select id from public.study_sessions where title = 'Sessão A'),
             'link', 'https://ex.com/x', 'a/b') $$,
  '23514', null,
  'a link evidence cannot also carry a storage_path'
);
select throws_ok(
  $$ insert into public.evidences (user_id, study_session_id, kind, storage_path)
     values ((select auth.uid()),
             (select id from public.study_sessions where title = 'Sessão A'),
             'file', null) $$,
  '23514', null,
  'a file evidence requires a storage_path'
);

-- ---- User B sees none of A's rows ------------------------------------------
set local request.jwt.claim.sub = '90000000-0000-0000-0000-0000000000b2';
select is((select count(*)::int from public.portfolio_profiles), 0, 'B cannot read A portfolio_profiles');
select is((select count(*)::int from public.portfolio_status), 0, 'B cannot read A portfolio_status');
select is((select count(*)::int from public.portfolio_links), 0, 'B cannot read A portfolio_links');
select is((select count(*)::int from public.stack_items), 0, 'B cannot read A stack_items');
select is((select count(*)::int from public.career_entries), 0, 'B cannot read A career_entries');
select is((select count(*)::int from public.study_sessions), 0, 'B cannot read A study_sessions');
select is((select count(*)::int from public.evidences), 0, 'B cannot read A evidences');

-- ...and cannot write into A's rows
with hijack as (
  update public.study_sessions set title = 'hijack' where true returning id
)
select is((select count(*)::int from hijack), 0, 'B update on A study_sessions affects no row');
select throws_ok(
  $$ insert into public.study_sessions (user_id, studied_on, title)
     values ('90000000-0000-0000-0000-0000000000b1', '2026-09-02', 'forged') $$,
  '42501', null,
  'B cannot insert a study_session owned by A'
);

-- ---- Anonymous: no raw read on any of them --------------------------------
reset role;
set local role anon;
select throws_ok($$ select count(*) from public.portfolio_profiles $$, '42501', null, 'anon denied portfolio_profiles');
select throws_ok($$ select count(*) from public.portfolio_status $$,   '42501', null, 'anon denied portfolio_status');
select throws_ok($$ select count(*) from public.portfolio_links $$,    '42501', null, 'anon denied portfolio_links');
select throws_ok($$ select count(*) from public.stack_items $$,        '42501', null, 'anon denied stack_items');
select throws_ok($$ select count(*) from public.career_entries $$,     '42501', null, 'anon denied career_entries');
select throws_ok($$ select count(*) from public.study_sessions $$,     '42501', null, 'anon denied study_sessions');
select throws_ok($$ select count(*) from public.evidences $$,          '42501', null, 'anon denied evidences');

select * from finish();
rollback;
