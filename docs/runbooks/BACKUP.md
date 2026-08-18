# Backup

## Target

Daily encrypted off-site DB/Auth + Storage backup to private Cloudflare R2. RPO ≤24h; target RTO ≤4h best-effort. Retain 7 daily + 4 weekly automatically.

## Preconditions

Administrative runner only. Required secret names are configured in the platform secret store; values never enter Git/chat. `BACKUP_RECIPIENT` is the public age recipient; the private recovery identity is not in CI.

## Run

```bash
bash scripts/backup/backup.sh
python3 scripts/backup/r2-retention.py          # dry-run
CONFIRM_R2_PRUNE=YES python3 scripts/backup/r2-retention.py --apply
```

## Gate

Encrypted artifact uploaded; manifest/checksums created; retention dry-run is sane. A backup is not declared healthy until a real restore drill succeeds.

## Abort / recovery

Upload, checksum, DB dump, Storage export, or encryption failure fails the job. Never upload plaintext backup material to R2.

## Evidence

backup_id, timestamp, encrypted/uploaded flags, checksum result, retention result; never log private content or credentials.
