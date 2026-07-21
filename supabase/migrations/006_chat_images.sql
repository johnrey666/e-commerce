-- Chat photo attachments + storage bucket.
-- Run in Supabase SQL Editor after prior migrations.

alter table public.order_messages
  add column if not exists image_url text;

alter table public.order_messages
  alter column body drop not null;

alter table public.order_messages
  alter column body set default '';

alter table public.order_messages
  drop constraint if exists order_messages_body_check;

alter table public.order_messages
  drop constraint if exists order_messages_content_check;

alter table public.order_messages
  add constraint order_messages_content_check
  check (
    (body is not null and char_length(trim(body)) > 0)
    or (image_url is not null and char_length(trim(image_url)) > 0)
  );

-- Public chat images (paths are unguessable UUIDs under the sender folder)
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'chat-media',
  'chat-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Chat participants upload media" on storage.objects;
create policy "Chat participants upload media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Chat participants update own media" on storage.objects;
create policy "Chat participants update own media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Chat participants delete own media" on storage.objects;
create policy "Chat participants delete own media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
