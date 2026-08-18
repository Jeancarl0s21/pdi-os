-- PDI OS Foundation — Storage buckets and owner-scoped policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-assets', 'portfolio-assets', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('project-covers', 'project-covers', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('evidence-files', 'evidence-files', false, 5242880, array[
    'application/pdf','image/jpeg','image/png','image/webp','text/plain','text/csv',
    'application/json','application/x-ipynb+json'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object names MUST start with the authenticated owner UUID: <user_id>/<uuid>/<filename>.
create policy storage_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id in ('portfolio-assets','project-covers','evidence-files')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy storage_owner_select
on storage.objects for select to authenticated
using (
  bucket_id in ('portfolio-assets','project-covers','evidence-files')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy storage_owner_update
on storage.objects for update to authenticated
using (
  bucket_id in ('portfolio-assets','project-covers','evidence-files')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('portfolio-assets','project-covers','evidence-files')
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy storage_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id in ('portfolio-assets','project-covers','evidence-files')
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- portfolio-assets is intentionally public at bucket level for Portfolio avatar/assets.
-- project-covers and evidence-files remain private; no anonymous object-table policy is added.
