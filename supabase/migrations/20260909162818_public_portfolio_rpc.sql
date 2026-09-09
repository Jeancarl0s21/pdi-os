-- PDI OS Slice 2 · PR-3 — public Portfolio read path.
--
-- `get_public_portfolio()` is the ONLY surface the anonymous visitor touches.
-- It is SECURITY DEFINER *on purpose*: anon has no SELECT on any raw domain
-- table (the Foundation's `revoke all ... from anon` stands) and this function
-- never returns a table row — only an explicit JSON DTO of fields meant to be
-- public. A Project in `draft` can never appear: the projects query filters
-- `publication_status = 'published'`, so knowing a draft's id buys nothing
-- (RN-PORTFOLIO-002/003, RNF-SEC-008).
--
-- Single-user MVP (PRD §4.1): no owner parameter. The function resolves THE
-- account; if the row count is ever not exactly 1 it returns null rather than
-- leak an arbitrary user's data.
--
-- No RLS / policy / grant on any table changes in this migration.

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
