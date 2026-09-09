begin;
select plan(8);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values ('80000000-0000-0000-0000-0000000000a1', 'authenticated', 'authenticated', 'pr3e@example.invalid', '', now(), now(), now());

set local role authenticated;
set local request.jwt.claim.sub = '80000000-0000-0000-0000-0000000000a1';

insert into public.portfolio_profiles (user_id, name) values ((select auth.uid()), 'Jean');

insert into public.tracks (user_id, slug, title) values ((select auth.uid()), 'trk', 'Track');
insert into public.modules (user_id, track_id, slug, title, position)
values ((select auth.uid()), (select id from public.tracks where slug = 'trk'), 'mod', 'Module', 0);

-- studying + authorized  → visible
insert into public.topics (user_id, module_id, slug, title, status, public_exposure_authorized, position)
values ((select auth.uid()), (select id from public.modules where slug = 'mod'), 'shown', 'Shown Topic', 'studying', true, 0);
-- studying + NOT authorized → hidden
insert into public.topics (user_id, module_id, slug, title, status, public_exposure_authorized, position)
values ((select auth.uid()), (select id from public.modules where slug = 'mod'), 'unauth', 'Unauth Topic', 'studying', false, 1);
-- authorized but not studying → hidden
insert into public.topics (user_id, module_id, slug, title, status, public_exposure_authorized, position)
values ((select auth.uid()), (select id from public.modules where slug = 'mod'), 'notstudy', 'Not Studying', 'not_started', true, 2);

select set_config('pdi.shown', (select id::text from public.topics where slug = 'shown'), true);

reset role;
set local role anon;
select set_config('pdi.dto', (select public.get_public_portfolio())::text, true);

select is(
  (select count(*)::int from json_array_elements(current_setting('pdi.dto')::json -> 'currentlyStudying')),
  1,
  'only the studying + authorized topic is exposed'
);
select is(
  current_setting('pdi.dto')::json -> 'currentlyStudying' -> 0 ->> 'title',
  'Shown Topic',
  'the exposed topic is the authorized one'
);
select is(
  current_setting('pdi.dto')::json -> 'currentlyStudying' -> 0 ->> 'moduleTitle',
  'Module',
  'currentlyStudying carries the module title'
);
select is(
  (
    select count(*)::int
    from json_array_elements(current_setting('pdi.dto')::json -> 'currentlyStudying') e
    where e ->> 'title' in ('Unauth Topic', 'Not Studying')
  ),
  0,
  'unauthorized and non-studying topics never appear'
);

-- anon still cannot read the raw table
select throws_ok($$ select count(*) from public.topics $$, '42501', null, 'anon still has no raw topics read');

-- complete the topic → it drops from the DTO, flag stays (RN-PUBLIC-STUDY-004/005)
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '80000000-0000-0000-0000-0000000000a1';
insert into public.activities (user_id, topic_id, title, instruction, position, completed_at)
values ((select auth.uid()), current_setting('pdi.shown')::uuid, 'a', 'do', 0, now());
select public.complete_topic(current_setting('pdi.shown')::uuid);
select is(
  (select public_exposure_authorized from public.topics where id = current_setting('pdi.shown')::uuid),
  true,
  'authorization flag persists after completion (RN-PUBLIC-STUDY-005)'
);

reset role;
set local role anon;
select is(
  (select count(*)::int from json_array_elements((select public.get_public_portfolio())::json -> 'currentlyStudying')),
  0,
  'a completed topic drops out of currentlyStudying (RN-PUBLIC-STUDY-004)'
);

reset role;
select is(
  (select prosecdef from pg_proc where proname = 'get_public_portfolio' and pronamespace = 'public'::regnamespace),
  true,
  'get_public_portfolio is still SECURITY DEFINER'
);

select * from finish();
rollback;
