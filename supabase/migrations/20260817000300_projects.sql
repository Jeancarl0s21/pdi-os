-- PDI OS Foundation — Project single source and Topic mappings.

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  source_key text,
  name text not null check (btrim(name) <> ''),
  short_description text,
  full_description text,
  cover_path text,
  execution_status text not null default 'planned'
    check (execution_status in ('planned', 'in_progress', 'completed', 'archived')),
  publication_status text not null default 'draft'
    check (publication_status in ('draft', 'published')),
  github_url text,
  demo_url text,
  project_date date,
  source_version text,
  source_hash text,
  source_order integer check (source_order is null or source_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.project_topics (
  user_id uuid not null references public.app_users(id) on delete cascade,
  project_id uuid not null,
  topic_id uuid not null,
  primary key (project_id, topic_id),
  constraint project_topics_project_owner_fk foreign key (user_id, project_id)
    references public.projects(user_id, id) on delete cascade,
  constraint project_topics_topic_owner_fk foreign key (user_id, topic_id)
    references public.topics(user_id, id) on delete cascade
);

create table public.project_technologies (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  project_id uuid not null,
  name text not null check (btrim(name) <> ''),
  position integer not null check (position >= 0),
  unique (user_id, id),
  constraint project_technologies_project_owner_fk foreign key (user_id, project_id)
    references public.projects(user_id, id) on delete cascade
);

create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();
