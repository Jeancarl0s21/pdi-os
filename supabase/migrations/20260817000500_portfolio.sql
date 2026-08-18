-- PDI OS Foundation — explicit Portfolio configuration, not a generic CMS.

create table public.portfolio_profiles (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  headline text,
  intro text,
  about text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.career_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  organization text,
  period_text text,
  description text,
  position integer not null check (position >= 0),
  unique (user_id, id)
);

create table public.portfolio_links (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  type text,
  label text not null check (btrim(label) <> ''),
  href text not null check (btrim(href) <> ''),
  position integer not null check (position >= 0),
  unique (user_id, id)
);

create table public.stack_items (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  group_name text,
  is_featured boolean not null default false,
  position integer not null check (position >= 0),
  unique (user_id, id)
);

create table public.portfolio_status (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  company text,
  role text,
  focus text,
  learning text,
  current_project_id uuid,
  building_text text,
  constraint portfolio_status_project_owner_fk foreign key (user_id, current_project_id)
    references public.projects(user_id, id) on delete set null,
  constraint portfolio_status_building_source_ck check (
    not (current_project_id is not null and building_text is not null)
  )
);

create trigger portfolio_profiles_set_updated_at before update on public.portfolio_profiles
for each row execute function public.set_updated_at();
