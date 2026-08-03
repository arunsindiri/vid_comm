-- Phase 4: Video Upload
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Videos table: one row per uploaded video
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  title text,
  description text,
  cloudinary_public_id text,
  video_url text not null,
  thumbnail_url text,
  duration_seconds integer,
  created_at timestamptz default now()
);

-- 2. Row Level Security: anyone can read videos, only the owner writes/deletes
alter table public.videos enable row level security;

create policy "Videos are viewable by everyone"
  on public.videos for select
  using (true);

create policy "Users can insert their own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own videos"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own videos"
  on public.videos for delete
  using (auth.uid() = user_id);
