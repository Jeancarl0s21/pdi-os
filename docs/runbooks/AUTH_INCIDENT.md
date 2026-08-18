# Auth Incident

Scope: unexpected private access, account lockout, reset abuse, session anomaly, or auth configuration drift.

1. Confirm environment and whether the issue is navigation-only or true authorization/data exposure.
2. Revalidate Supabase Auth configuration: email/password, public signup disabled, exact redirect allowlist, session/PKCE flow.
3. Verify sensitive reads/mutations enforce server auth/authz and RLS; UI visibility is not authorization.
4. Revoke/rotate affected credentials/sessions when required.
5. For account recovery, use approved Supabase administrative recovery rather than enabling public signup.
6. Run two-user RLS tests and private-route smoke before closure.

Never log email/password/JWT/cookies/reset tokens.
