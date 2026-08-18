# Seed Import

Seed is an explicit administrative operation, never migration/startup behavior.

## Validate
```bash
pnpm seed:validate
```
Gate: V1.2, 14 Modules, 74 Topics, 336 Contents, 74 Activities, 144 Materials, 5 Projects; unique source identities; canonical Topic→Suggested Project mappings.

## Dry-run
With admin DB URL + owner id supplied from local/CI secret store:
```bash
pnpm seed:dry-run
```
Review INSERT / SAFE_UPDATE / NOOP / CONFLICT / TOMBSTONED. `SOURCE_REMOVED` resolution is explicit; no automatic delete.

## Apply
```bash
CONFIRM_SEED_APPLY=YES pnpm seed:apply
```
Conflicts block apply. Import never overwrites progress, notes, public authorization, archive state, custom order, Tasks, Study/Evidence, Project execution/publication, or Portfolio.

## Evidence
Seed version/checksum and `seed_import_runs` result counts; never log private content bodies.
