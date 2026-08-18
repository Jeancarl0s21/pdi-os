#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_ARTIFACT:?path to encrypted backup required}"
: "${BACKUP_IDENTITY_FILE:?path to age private identity on operator machine only}"
: "${TARGET_DB_URL:?isolated restore target required}"
for bin in age pg_restore sha256sum tar pnpm; do command -v "$bin" >/dev/null || { echo "missing $bin" >&2; exit 2; }; done
umask 077; work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
age -d -i "$BACKUP_IDENTITY_FILE" -o "$work/backup.tar.gz" "$RESTORE_ARTIFACT"
tar -C "$work" -xzf "$work/backup.tar.gz"
( cd "$work" && sha256sum -c checksums.sha256 )
pg_restore --dbname="$TARGET_DB_URL" --clean --if-exists --no-owner "$work/database.dump"
if [[ -n "${NEXT_PUBLIC_SUPABASE_URL:-}" && -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then CONFIRM_STORAGE_RESTORE=YES pnpm tsx scripts/backup/import-storage.ts "$work/storage"; fi
printf '{"restore_ok":true,"checksum_ok":true,"backup":"%s"}\n' "$(basename "$RESTORE_ARTIFACT")"
