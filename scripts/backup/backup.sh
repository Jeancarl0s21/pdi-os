#!/usr/bin/env bash
set -euo pipefail
: "${SUPABASE_DB_URL:?required}"
: "${NEXT_PUBLIC_SUPABASE_URL:?required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?required in isolated backup runner}"
: "${BACKUP_RECIPIENT:?age public recipient required}"
: "${R2_ACCOUNT_ID:?required}"; : "${R2_BUCKET:?required}"; : "${R2_ACCESS_KEY_ID:?required}"; : "${R2_SECRET_ACCESS_KEY:?required}"
for bin in pg_dump age aws sha256sum tar pnpm; do command -v "$bin" >/dev/null || { echo "missing $bin" >&2; exit 2; }; done
umask 077
stamp="$(date -u +%Y%m%dT%H%M%SZ)"; work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
mkdir -p "$work/storage"
pg_dump --dbname="$SUPABASE_DB_URL" --format=custom --file="$work/database.dump"
pnpm tsx scripts/backup/export-storage.ts "$work/storage"
cat > "$work/manifest.json" <<JSON
{"format_version":1,"created_at":"$stamp","database":"database.dump","storage":"storage"}
JSON
( cd "$work" && sha256sum database.dump manifest.json > checksums.sha256 && find storage -type f -print0 | sort -z | xargs -0 -r sha256sum >> checksums.sha256 )
tar -C "$work" -czf "$work/pdi-os-$stamp.tar.gz" database.dump storage manifest.json checksums.sha256
age -r "$BACKUP_RECIPIENT" -o "$work/pdi-os-$stamp.tar.gz.age" "$work/pdi-os-$stamp.tar.gz"
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" AWS_DEFAULT_REGION=auto
endpoint="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
aws s3 cp "$work/pdi-os-$stamp.tar.gz.age" "s3://${R2_BUCKET}/daily/pdi-os-$stamp.tar.gz.age" --endpoint-url "$endpoint" --only-show-errors
printf '{"backup_id":"pdi-os-%s","encrypted":true,"uploaded":true}\n' "$stamp"
