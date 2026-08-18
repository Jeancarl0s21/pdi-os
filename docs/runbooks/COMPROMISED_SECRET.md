# Compromised Secret

1. Treat the credential as compromised; stop affected administrative workflow if safe.
2. Rotate/revoke at the issuing platform (Supabase, Vercel, R2, Sentry, GitHub as applicable).
3. Update only the appropriate environment secret store; never commit the replacement.
4. Verify Preview/Non-Prod/Production isolation and redeploy only where the rotated secret is required.
5. Search Git history/security alerts. If a secret entered Git history, revoke first; history cleanup does not make the old credential safe.
6. Run relevant smoke checks and close the incident.

Never paste secret values into issues, logs, runbooks, chat, or commits.

Evidence: secret type/name (not value), detection time, revoke/rotation time, affected environments, verification result.
