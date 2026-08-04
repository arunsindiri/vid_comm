-- Watch History (Phase 14)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Watch history table. One row per (user, video) holding the latest
--    watch position so we can offer "Continue watching" + "Recently watched".
create table if not exists public.watch_history (
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null constraint watch_history_video_id_fkey
    references public.videos(id) on delete cascade,
  last_position_seconds double precision not null default 0,
  duration_seconds integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

create index if not exists watch_history_user_updated_idx
  on public.watch_history (user_id, updated_at desc);

-- 2. Row Level Security: a user can only read/write their own history.
alter table public.watch_history enable row level security;

create policy "Users can view their own watch history"
  on public.watch_history for select
  using (user_id = auth.uid());

create policy "Users can add their own watch history"
  on public.watch_history for insert
  with check (user_id = auth.uid());

create policy "Users can update their own watch history"
  on public.watch_history for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
