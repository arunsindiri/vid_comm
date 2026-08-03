-- Likes (Phase 8)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Likes table: one row per (user, video). A user can like a video once.
create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references public.videos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- Index so "count likes for this video" and "videos this user liked" are fast.
create index if not exists likes_video_id_idx on public.likes (video_id);

-- 2. Row Level Security: like counts are public, only the liker can add/remove.
alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select
  using (true);

create policy "Users can like videos"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike"
  on public.likes for delete
  using (auth.uid() = user_id);
