-- Playlists
-- Run this in the Supabase SQL Editor.

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists playlists_user_created_idx
  on public.playlists (user_id, created_at desc);

alter table public.playlists enable row level security;

drop policy if exists "Users can view their own playlists" on public.playlists;
create policy "Users can view their own playlists"
  on public.playlists for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own playlists" on public.playlists;
create policy "Users can create their own playlists"
  on public.playlists for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own playlists" on public.playlists;
create policy "Users can update their own playlists"
  on public.playlists for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own playlists" on public.playlists;
create policy "Users can delete their own playlists"
  on public.playlists for delete
  using (auth.uid() = user_id);

create table if not exists public.playlist_videos (
  playlist_id uuid not null
    constraint playlist_videos_playlist_id_fkey
    references public.playlists(id) on delete cascade,
  video_id uuid not null
    constraint playlist_videos_video_id_fkey
    references public.videos(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (playlist_id, video_id)
);

create index if not exists playlist_videos_playlist_added_idx
  on public.playlist_videos (playlist_id, added_at);

alter table public.playlist_videos enable row level security;

drop policy if exists "Users can view their own playlist videos" on public.playlist_videos;
create policy "Users can view their own playlist videos"
  on public.playlist_videos for select
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can add their own playlist videos" on public.playlist_videos;
create policy "Users can add their own playlist videos"
  on public.playlist_videos for insert
  with check (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own playlist videos" on public.playlist_videos;
create policy "Users can update their own playlist videos"
  on public.playlist_videos for update
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete their own playlist videos" on public.playlist_videos;
create policy "Users can delete their own playlist videos"
  on public.playlist_videos for delete
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_id and p.user_id = auth.uid()
    )
  );
