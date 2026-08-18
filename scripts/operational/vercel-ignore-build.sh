#!/usr/bin/env bash
# Vercel ignoreCommand: exit 0 = skip deployment; exit 1 = build.
set -euo pipefail
base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
head="${VERCEL_GIT_COMMIT_SHA:-HEAD}"
if ! git cat-file -e "$base^{commit}" 2>/dev/null; then exit 1; fi
changed="$(git diff --name-only "$base" "$head")"
[[ -z "$changed" ]] && exit 0
while IFS= read -r file; do
  case "$file" in
    docs/*|README.md|*.md) ;;
    *) exit 1 ;;
  esac
done <<< "$changed"
exit 0
