-- PDI OS Foundation — Seed import audit and tombstone memory.

create table public.seed_import_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  seed_name text not null check (btrim(seed_name) <> ''),
  seed_version text not null check (btrim(seed_version) <> ''),
  checksum text not null check (btrim(checksum) <> ''),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'succeeded', 'failed', 'dry_run')),
  insert_count integer not null default 0 check (insert_count >= 0),
  update_count integer not null default 0 check (update_count >= 0),
  noop_count integer not null default 0 check (noop_count >= 0),
  conflict_count integer not null default 0 check (conflict_count >= 0),
  conflicts jsonb not null default '[]'::jsonb check (jsonb_typeof(conflicts) = 'array')
);

create table public.seed_tombstones (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  entity_type text not null check (btrim(entity_type) <> ''),
  source_key text not null check (btrim(source_key) <> ''),
  deleted_at timestamptz not null default now(),
  unique (user_id, entity_type, source_key)
);
