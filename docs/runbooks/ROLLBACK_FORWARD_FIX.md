# Rollback / Forward-Fix

Default database recovery after a committed schema change is forward-fix.

- Migration failed before commit: transaction aborts; correct and retry.
- New app failed while schema remains backward-compatible: restore prior app deployment.
- Schema changed incompatibly: ship a forward-fix migration/application patch.
- Destructive evolution: Release A expand, Release B migrate consumers/backfill, later Release C contract.

Never invent blanket down migrations. Record incident, affected release/commit, chosen recovery path, smoke result, and whether backup restore was required.
