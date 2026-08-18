-- PDI OS Foundation — Roadmap physical model.

create table public.tracks (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  source_key text,
  slug text not null check (btrim(slug) <> ''),
  title text not null check (btrim(title) <> ''),
  description text,
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.modules (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  track_id uuid not null,
  source_key text,
  slug text not null check (btrim(slug) <> ''),
  title text not null check (btrim(title) <> ''),
  description text,
  editorial_priority text check (editorial_priority is null or editorial_priority in ('Core', 'High', 'Advanced')),
  future_level_band text,
  position integer check (position is null or position >= 0),
  archived_at timestamptz,
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint modules_track_owner_fk foreign key (user_id, track_id)
    references public.tracks(user_id, id) on delete restrict,
  constraint modules_active_position_ck check (
    (archived_at is null and position is not null) or
    (archived_at is not null and position is null)
  )
);

create table public.topics (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  module_id uuid not null,
  source_key text,
  slug text not null check (btrim(slug) <> ''),
  title text not null check (btrim(title) <> ''),
  description text,
  notes text,
  status text not null default 'not_started' check (status in ('not_started', 'studying', 'completed')),
  public_exposure_authorized boolean not null default false,
  recommended_level text,
  editorial_priority text check (editorial_priority is null or editorial_priority in ('Core', 'High', 'Advanced')),
  position integer check (position is null or position >= 0),
  archived_at timestamptz,
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint topics_module_owner_fk foreign key (user_id, module_id)
    references public.modules(user_id, id) on delete restrict,
  constraint topics_active_position_ck check (
    (archived_at is null and position is not null) or
    (archived_at is not null and position is null)
  )
);

create table public.contents (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id uuid not null,
  source_key text,
  title text not null check (btrim(title) <> ''),
  didactic_payload jsonb not null check (jsonb_typeof(didactic_payload) = 'object'),
  payload_version smallint not null default 1 check (payload_version >= 1),
  completed_at timestamptz,
  position integer not null check (position >= 0),
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint contents_topic_owner_fk foreign key (user_id, topic_id)
    references public.topics(user_id, id) on delete cascade
);

create table public.activities (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id uuid not null,
  source_key text,
  title text not null check (btrim(title) <> ''),
  instruction text not null check (btrim(instruction) <> ''),
  external_environment text,
  execution_context text,
  dataset_or_source text,
  resources jsonb not null default '[]'::jsonb check (jsonb_typeof(resources) = 'array'),
  expected_output text,
  suggested_evidence text,
  external_url text,
  completed_at timestamptz,
  position integer not null check (position >= 0),
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint activities_topic_owner_fk foreign key (user_id, topic_id)
    references public.topics(user_id, id) on delete cascade
);

create table public.materials (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  topic_id uuid not null,
  source_key text,
  title text not null check (btrim(title) <> ''),
  type text not null check (btrim(type) <> ''),
  source text not null check (btrim(source) <> ''),
  url text not null check (btrim(url) <> ''),
  position integer not null check (position >= 0),
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint materials_topic_owner_fk foreign key (user_id, topic_id)
    references public.topics(user_id, id) on delete cascade
);

create trigger tracks_set_updated_at before update on public.tracks
for each row execute function public.set_updated_at();
create trigger modules_set_updated_at before update on public.modules
for each row execute function public.set_updated_at();
create trigger topics_set_updated_at before update on public.topics
for each row execute function public.set_updated_at();
create trigger contents_set_updated_at before update on public.contents
for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();
create trigger materials_set_updated_at before update on public.materials
for each row execute function public.set_updated_at();
