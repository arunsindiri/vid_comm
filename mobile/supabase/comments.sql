-- Text Comments (Phase 10)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Comments table: one comment per (user, video).
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index so "list comments for this video" stays fast.
create index if not exists comments_video_id_idx on public.comments (video_id);

-- Link each comment to its author's profile row so we can show the
-- author's username and avatar in the same query (same pattern as
-- videos -> profiles in feed.sql).
alter table public.comments
  add constraint comments_user_profile_fkey
  foreign key (user_id) references public.profiles(id);

-- 2. Row Level Security: comments are public, only the author can edit/delete.
alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Users can post comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can edit their own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);
