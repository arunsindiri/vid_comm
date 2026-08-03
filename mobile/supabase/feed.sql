-- Phase 5: Home Feed
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Link each video to its creator's profile row so the feed can show
--    the uploader's username and avatar in one query.
alter table public.videos
  add constraint videos_user_profile_fkey
  foreign key (user_id) references public.profiles(id);

-- 2. Speed up feed queries (newest first)
create index if not exists videos_created_at_idx
  on public.videos (created_at desc);
