-- PDI OS Slice 3 · PR-5 — public "Atualmente estudando".
--
-- Extends public.get_public_portfolio() with `currentlyStudying`: the Topics
-- that are BOTH `status = 'studying'` AND `public_exposure_authorized = true`
-- (RN-PUBLIC-STUDY-002/003). The authorization flag persists when the Topic
-- leaves `studying` (RN-PUBLIC-STUDY-005); visibility is purely the status
-- filter here, so a completed / reset Topic drops out automatically
-- (RN-PUBLIC-STUDY-004).
--
-- Still the ONLY anon surface, still SECURITY DEFINER + DTO-only (no raw rows),
-- grants unchanged. Only the returned JSON gains one key.

create or replace function public.get_public_portfolio()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_result json;
begin
  if (select count(*) from public.app_users) <> 1 then
    return null;
  end if;
  select id into v_owner from public.app_users;

  select json_build_object(
    'profile', (
      select json_build_object(
        'name', pp.name,
        'headline', pp.headline,
        'intro', pp.intro,
        'about', pp.about
      )
      from public.portfolio_profiles pp
      where pp.user_id = v_owner
    ),
    'status', (
      select json_build_object(
        'company', ps.company,
        'role', ps.role,
        'focus', ps.focus,
        'building', coalesce(
          ps.building_text,
          (
            select p.name
            from public.projects p
            where p.id = ps.current_project_id
              and p.user_id = v_owner
              and p.publication_status = 'published'
          )
        )
      )
      from public.portfolio_status ps
      where ps.user_id = v_owner
    ),
    'links', coalesce((
      select json_agg(
        json_build_object('type', l.type, 'label', l.label, 'href', l.href)
        order by l.position
      )
      from public.portfolio_links l
      where l.user_id = v_owner
    ), '[]'::json),
    'stack', coalesce((
      select json_agg(
        json_build_object(
          'name', s.name,
          'groupName', s.group_name,
          'isFeatured', s.is_featured
        )
        order by s.position
      )
      from public.stack_items s
      where s.user_id = v_owner
    ), '[]'::json),
    'currentlyStudying', coalesce((
      select json_agg(
        json_build_object('title', t.title, 'moduleTitle', m.title)
        order by m.position, t.position
      )
      from public.topics t
      join public.modules m
        on m.id = t.module_id and m.user_id = v_owner and m.archived_at is null
      where t.user_id = v_owner
        and t.status = 'studying'
        and t.public_exposure_authorized = true
        and t.archived_at is null
    ), '[]'::json),
    'projects', coalesce((
      select json_agg(
        json_build_object(
          'id', p.id,
          'name', p.name,
          'shortDescription', p.short_description,
          'fullDescription', p.full_description,
          'technologies', coalesce((
            select json_agg(t.name order by t.position)
            from public.project_technologies t
            where t.project_id = p.id and t.user_id = v_owner
          ), '[]'::json),
          'githubUrl', p.github_url,
          'demoUrl', p.demo_url,
          'projectDate', p.project_date,
          'executionStatus', p.execution_status,
          'coverPath', p.cover_path
        )
        order by p.project_date desc nulls last, p.created_at desc
      )
      from public.projects p
      where p.user_id = v_owner
        and p.publication_status = 'published'
    ), '[]'::json)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_public_portfolio() from public;
grant execute on function public.get_public_portfolio() to anon, authenticated;
