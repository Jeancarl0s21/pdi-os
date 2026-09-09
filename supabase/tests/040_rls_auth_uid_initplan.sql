begin;
select plan(2);

-- Architecture rule: RLS predicates must use (select auth.uid()), never a bare
-- auth.uid() that Postgres re-evaluates per row (Supabase advisor auth_rls_initplan).
-- Postgres pretty-prints the wrapped form as "( SELECT auth.uid() AS uid)".

select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public'
      and policyname like '%\_owner\_%'
      and (
        (coalesce(qual, '') ~ 'auth\.uid\(\)' and coalesce(qual, '') !~ 'SELECT auth\.uid\(\)')
        or
        (coalesce(with_check, '') ~ 'auth\.uid\(\)' and coalesce(with_check, '') !~ 'SELECT auth\.uid\(\)')
      )
  ),
  0,
  'no public *_owner_* policy uses a bare auth.uid()'
);

select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public' and tablename = 'app_users'
      and qual ~ 'SELECT auth\.uid\(\)'
  ),
  2,
  'both app_users owner policies wrap auth.uid()'
);

select * from finish();
rollback;
