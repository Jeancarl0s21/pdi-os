-- PDI OS Foundation — Tasks, tags, study sessions and Evidence.

create table public.tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  description text,
  category text check (category is null or category in ('work', 'study', 'project', 'personal')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'backlog' check (status in ('backlog', 'in_progress', 'done')),
  due_date date,
  topic_id uuid,
  project_id uuid,
  position integer check (position is null or position >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint tasks_topic_owner_fk foreign key (user_id, topic_id)
    references public.topics(user_id, id) on delete set null,
  constraint tasks_project_owner_fk foreign key (user_id, project_id)
    references public.projects(user_id, id) on delete set null,
  constraint tasks_active_position_ck check (
    (archived_at is null and position is not null) or
    (archived_at is not null and position is null)
  )
);

create table public.tags (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id)
);

create table public.task_tags (
  user_id uuid not null references public.app_users(id) on delete cascade,
  task_id uuid not null,
  tag_id uuid not null,
  primary key (task_id, tag_id),
  constraint task_tags_task_owner_fk foreign key (user_id, task_id)
    references public.tasks(user_id, id) on delete cascade,
  constraint task_tags_tag_owner_fk foreign key (user_id, tag_id)
    references public.tags(user_id, id) on delete cascade
);

create table public.study_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  studied_on date not null,
  title text not null check (btrim(title) <> ''),
  note text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  topic_id uuid,
  project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint study_sessions_topic_owner_fk foreign key (user_id, topic_id)
    references public.topics(user_id, id) on delete set null,
  constraint study_sessions_project_owner_fk foreign key (user_id, project_id)
    references public.projects(user_id, id) on delete set null
);

create table public.evidences (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  activity_id uuid,
  study_session_id uuid,
  kind text not null check (kind in ('link', 'file')),
  title text,
  external_url text,
  storage_path text,
  original_filename text,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, id),
  constraint evidences_activity_owner_fk foreign key (user_id, activity_id)
    references public.activities(user_id, id) on delete cascade,
  constraint evidences_study_session_owner_fk foreign key (user_id, study_session_id)
    references public.study_sessions(user_id, id) on delete cascade,
  constraint evidence_exactly_one_context_ck check (num_nonnulls(activity_id, study_session_id) = 1),
  constraint evidence_kind_payload_ck check (
    (kind = 'link' and external_url is not null and storage_path is null) or
    (kind = 'file' and storage_path is not null and external_url is null)
  )
);

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function public.set_updated_at();
create trigger tags_set_updated_at before update on public.tags
for each row execute function public.set_updated_at();
create trigger study_sessions_set_updated_at before update on public.study_sessions
for each row execute function public.set_updated_at();
create trigger evidences_set_updated_at before update on public.evidences
for each row execute function public.set_updated_at();
