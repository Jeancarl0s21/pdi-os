begin;
select plan(5);

-- Identity provisioning: creating an auth user must mirror into public.app_users
-- via the on_auth_user_created trigger (PRD "app_users on signup"; no public signup).
insert into auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
values (
  'a0000000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'identity-trigger@example.invalid', '', now(), now()
);

select is(
  (select count(*)::int from public.app_users where id = 'a0000000-0000-4000-8000-000000000001'),
  1,
  'on_auth_user_created creates the matching app_users row'
);

select is(
  (
    select count(*)::int
    from public.app_users a
    join auth.users u on u.id = a.id
    where a.id = 'a0000000-0000-4000-8000-000000000001'
  ),
  1,
  'app_users row is keyed to the auth.users row'
);

delete from auth.users where id = 'a0000000-0000-4000-8000-000000000001';

select is(
  (select count(*)::int from public.app_users where id = 'a0000000-0000-4000-8000-000000000001'),
  0,
  'deleting the auth.users row cascades to app_users'
);

-- Architecture rule 2: the definer helper stays definer but is not callable as an RPC.
select is(
  (
    select prosecdef
    from pg_proc
    where proname = 'handle_auth_user_created'
      and pronamespace = 'public'::regnamespace
  ),
  true,
  'handle_auth_user_created runs as SECURITY DEFINER'
);

select ok(
  not has_function_privilege('authenticated', 'public.handle_auth_user_created()', 'execute')
    and not has_function_privilege('anon', 'public.handle_auth_user_created()', 'execute'),
  'handle_auth_user_created EXECUTE is revoked from anon and authenticated'
);

select * from finish();
rollback;
