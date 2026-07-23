-- Allow any admin to delete any landing-media object (not only their own folder).
-- Needed so replace/remove always cleans storage. Run in Supabase SQL Editor.

drop policy if exists "Admins can delete landing media" on storage.objects;
create policy "Admins can delete landing media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'landing-media'
    and public.is_admin()
  );
