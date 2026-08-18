# Restore / DR

First real drill occurs after backup implementation, then quarterly and after material backup/restore changes.

## Preconditions
Use an isolated disposable restore target, never the live Production database. Recovery private identity is supplied from the operator password manager/offline custody and is never stored in CI.

## Run
```bash
RESTORE_ARTIFACT=/secure/path/backup.age \
BACKUP_IDENTITY_FILE=/secure/path/age-identity.txt \
TARGET_DB_URL='from-secret-store' \
bash scripts/backup/restore-drill.sh
```
Then run migration/schema/RLS smoke and verify login/owner, Tasks, Roadmap/progress, StudySessions, Projects/mappings, Portfolio, Evidence metadata and Storage objects.

## Abort / recovery
Checksum failure aborts before restore. Missing Storage objects are investigated/recovered from off-site backup before domain references are altered.

## Evidence
`date, backup_id, checksum_ok, restore_ok, tests_ok, duration, issues` without sensitive payloads.
