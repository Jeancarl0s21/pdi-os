# Deploy

## Preconditions

- CI required checks green on the exact commit.
- Target environment identified; Production requires explicit authorization.
- No Production secret is present in Preview/Non-Prod.
- For Production, backup health is green before any migration/deploy sequence.

## Non-Prod

1. Apply the exact migration set to the isolated Non-Prod Supabase project.
2. Run DB/RLS/RPC tests and smoke checks.
3. Vercel Preview builds `apps/web`; docs/runbooks-only diffs are skipped by `apps/web/vercel.json` + `scripts/operational/vercel-ignore-build.sh`.
4. Run Playwright/axe against Preview.

## Production

`healthy backup → migrations → DB smoke → application deploy → Production smoke`.
Do not create or target Production until explicitly authorized.

## Abort / recovery

Stop before deploy if backup, migration, DB smoke, isolation, or required CI is not green. After a committed incompatible schema change, use forward-fix; do not improvise a destructive down migration.

## Evidence

Commit SHA, migration history, CI run, deploy ID, smoke result, timestamp.
