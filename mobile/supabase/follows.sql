-- Followers / Following (added after Phase 3 per client request)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Follows table: one row per follow (follower -> following)
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- 2. Row Level Security: follows are public, only the follower can add/remove
alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow other profiles"
  on public.follows for insert
  with check (auth.uid() = follower_id and follower_id <> following_id);

create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);
