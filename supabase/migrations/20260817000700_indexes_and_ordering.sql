-- PDI OS Foundation — query indexes, seed identities and dense-order integrity.

-- Stable Seed identities are scoped per owner and per table.
create unique index tracks_source_key_uq on public.tracks(user_id, source_key) where source_key is not null;
create unique index modules_source_key_uq on public.modules(user_id, source_key) where source_key is not null;
create unique index topics_source_key_uq on public.topics(user_id, source_key) where source_key is not null;
create unique index contents_source_key_uq on public.contents(user_id, source_key) where source_key is not null;
create unique index activities_source_key_uq on public.activities(user_id, source_key) where source_key is not null;
create unique index materials_source_key_uq on public.materials(user_id, source_key) where source_key is not null;
create unique index projects_source_key_uq on public.projects(user_id, source_key) where source_key is not null;

create unique index tags_name_ci_uq on public.tags(user_id, lower(name));
create unique index project_technologies_name_ci_uq on public.project_technologies(project_id, lower(name));

-- Human-readable slugs remain unique in their natural parent scope.
create unique index tracks_slug_uq on public.tracks(user_id, lower(slug));
create unique index modules_slug_uq on public.modules(user_id, track_id, lower(slug));
create unique index topics_slug_uq on public.topics(user_id, module_id, lower(slug));

-- Deferrable dense-position uniqueness supports transactional reorders without float/LexoRank keys.
alter table public.tasks add constraint tasks_position_uq
  unique (user_id, status, position) deferrable initially deferred;
alter table public.modules add constraint modules_position_uq
  unique (user_id, track_id, position) deferrable initially deferred;
alter table public.topics add constraint topics_position_uq
  unique (user_id, module_id, position) deferrable initially deferred;
alter table public.contents add constraint contents_position_uq
  unique (user_id, topic_id, position) deferrable initially deferred;
alter table public.activities add constraint activities_position_uq
  unique (user_id, topic_id, position) deferrable initially deferred;
alter table public.materials add constraint materials_position_uq
  unique (user_id, topic_id, position) deferrable initially deferred;
alter table public.project_technologies add constraint project_technologies_position_uq
  unique (user_id, project_id, position) deferrable initially deferred;
alter table public.career_entries add constraint career_entries_position_uq
  unique (user_id, position) deferrable initially deferred;
alter table public.portfolio_links add constraint portfolio_links_position_uq
  unique (user_id, position) deferrable initially deferred;
alter table public.stack_items add constraint stack_items_position_uq
  unique (user_id, position) deferrable initially deferred;

-- Query-pattern indexes from Architecture Master V1.0 §5.2.
create index tasks_active_kanban_idx on public.tasks(user_id, status, position) where archived_at is null;
create index tasks_planning_idx on public.tasks(user_id, due_date) where archived_at is null;
create index modules_order_idx on public.modules(user_id, track_id, position) where archived_at is null;
create index topics_order_idx on public.topics(user_id, module_id, position) where archived_at is null;
create index topics_currently_studying_idx
  on public.topics(user_id, status, public_exposure_authorized)
  where archived_at is null;
create index contents_topic_order_idx on public.contents(user_id, topic_id, position);
create index activities_topic_order_idx on public.activities(user_id, topic_id, position);
create index materials_topic_order_idx on public.materials(user_id, topic_id, position);
create index study_sessions_timeline_idx on public.study_sessions(user_id, studied_on desc, created_at desc);
create index projects_private_idx on public.projects(user_id, execution_status, publication_status, updated_at desc);
create index projects_public_idx on public.projects(user_id, updated_at desc)
  where publication_status = 'published' and execution_status <> 'archived';
create index project_topics_reverse_idx on public.project_topics(topic_id, project_id);
create index evidences_activity_idx on public.evidences(activity_id) where activity_id is not null;
create index evidences_study_session_idx on public.evidences(study_session_id) where study_session_id is not null;
create index career_entries_order_idx on public.career_entries(user_id, position);
create index portfolio_links_order_idx on public.portfolio_links(user_id, position);
create index stack_items_order_idx on public.stack_items(user_id, position);
