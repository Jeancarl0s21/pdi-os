-- PDI OS — LOCAL / CI SEED ONLY.
--
-- Runs exclusively on `supabase db reset` (local dev and the `database` / `e2e-a11y`
-- CI jobs). It is NEVER applied to Non-Prod or Production — those receive migrations
-- only (`supabase db push`), never seed.sql. This file is unrelated to the versioned
-- domain Seed importer (`scripts/roadmap-import/`).
--
-- Purpose: a deterministic authenticated user so Playwright can exercise the private
-- app shell. Public signup stays disabled (PRD RF-AUTH-005); this row is inserted
-- directly, mirroring the approach already used in supabase/tests/020_rls.sql.

do $$
declare
  seed_user_id constant uuid := 'e2e00000-0000-4000-8000-000000000001';
  seed_email constant text := 'e2e@pdi-os.test';
  seed_password constant text := 'e2e-local-password-001';
begin
  if exists (select 1 from auth.users where id = seed_user_id) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    seed_user_id, 'authenticated', 'authenticated', seed_email,
    extensions.crypt(seed_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  )
  values (
    seed_user_id::text, seed_user_id,
    jsonb_build_object(
      'sub', seed_user_id::text,
      'email', seed_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email', now(), now(), now()
  );
end $$;
