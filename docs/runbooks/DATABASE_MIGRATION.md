# Database Migration

## Preconditions

Docker + project dependencies available locally. `supabase/migrations/*.sql` is the schema source of truth.

## Local verification

```bash
pnpm db:start
pnpm db:reset
pnpm db:lint
pnpm test:db
```

Never treat a Dashboard schema edit as the normal workflow.

## Promotion

Use the exact migration set that passed CI. Non-Prod precedes Production. Production sequence requires a healthy backup before controlled migration.

## Abort / recovery

If local reset/lint/pgTAP/RLS/RPC fails, do not promote. If a transaction fails before commit, fix the migration. If committed schema needs correction, add a forward-fix migration. Destructive rename/drop uses expand/contract and a recent healthy backup.

## Evidence

Migration filenames, clean-reset result, lint result, pgTAP result, target migration history.
