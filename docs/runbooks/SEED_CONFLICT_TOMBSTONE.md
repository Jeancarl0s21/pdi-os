# Seed Conflict / Tombstone

## Conflict
A row is a conflict when its current editorial hash differs from the stored `source_hash` while the incoming Seed also changed. Do not overwrite automatically. Resolve by deciding whether the human editorial change or the incoming canonical editorial content should become the new baseline, then perform an explicit admin action and rerun dry-run.

## Tombstone
Hard-deleting Seed-derived Content, Activity, Material, or a canonical Project↔Topic mapping records importer memory in `seed_tombstones`. A matching tombstone causes future imports to skip recreation.

Project↔Topic mapping identity: `PTMAP:{project_source_key}:{topic_source_key}`.

Administrative restore removes the tombstone explicitly. Seed version removal never auto-deletes runtime rows.

## Evidence
Entity type, source_key, resolution action, operator/date; no private body dumps.
