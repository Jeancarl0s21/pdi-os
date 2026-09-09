-- Performance hardening (continuation of 20260901010446): the storage.objects
-- owner policies from 20260817001000_storage.sql still evaluate auth.uid() per
-- row. The public-schema advisor (auth_rls_initplan) does not scan the storage
-- schema, so this was missed. Wrap auth.uid() as (select auth.uid()) here too.
--
-- ALTER POLICY only redefines the predicate, so this is idempotent and safe to
-- re-apply via `supabase db push`.

alter policy storage_owner_insert on storage.objects
  with check (
    bucket_id in ('portfolio-assets', 'project-covers', 'evidence-files')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy storage_owner_select on storage.objects
  using (
    bucket_id in ('portfolio-assets', 'project-covers', 'evidence-files')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy storage_owner_update on storage.objects
  using (
    bucket_id in ('portfolio-assets', 'project-covers', 'evidence-files')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('portfolio-assets', 'project-covers', 'evidence-files')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter policy storage_owner_delete on storage.objects
  using (
    bucket_id in ('portfolio-assets', 'project-covers', 'evidence-files')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
