-- Raise landing-media upload limit to 250 MB for large hero videos.
-- Run in Supabase SQL Editor (Dashboard → SQL → New query → Run).

update storage.buckets
set file_size_limit = 262144000
where id = 'landing-media';
