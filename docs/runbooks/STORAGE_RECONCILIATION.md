# Storage Reconciliation

Compares DB references with Supabase Storage objects. Default is dry-run. Orphans have a 7-day grace period; missing referenced files are critical and recovery from backup is attempted first.

```bash
pnpm storage:reconcile
BACKUP_HEALTHY=YES CONFIRM_STORAGE_DELETE=YES pnpm storage:reconcile -- --apply
```

`--apply` deletes only eligible orphan objects via Storage API. It must not alter domain references merely to hide missing files.

## Abort
Any missing referenced object, unhealthy backup, object-list error, or deletion error stops safe cleanup.

## Evidence
Missing list, orphan list, eligible list, deleted list, run timestamp. Do not log signed URLs or file bodies.
