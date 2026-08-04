-- Notifications (Phase 13)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Notifications table. One row per notification, created automatically
--    by DB triggers (so they are never missed, even if the app is closed).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null check (type in ('like', 'follow', 'comment', 'reply', 'mention')),
  video_id uuid references public.videos(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- 2. Row Level Security: a user can only see/mark their own notifications.
--    Writes happen inside security-definer trigger functions below.
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "Users can mark their own notifications as read"
  on public.notifications for update
  using (recipient_id = auth.uid());

-- 3. Trigger functions. Each runs as the table owner (security definer) so
--    it can insert a row on the recipient's behalf, bypassing RLS.

-- 3a. A new like -> notify the video's uploader.
create or replace function public.notify_on_like()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notifications (recipient_id, actor_id, type, video_id)
  select v.user_id, new.user_id, 'like', new.video_id
  from public.videos v
  where v.id = new.video_id
    and v.user_id <> new.user_id;
  return new;
end $$;

create trigger notify_on_like
  after insert on public.likes
  for each row execute function public.notify_on_like();

-- 3b. A new follow -> notify the followed user.
create or replace function public.notify_on_follow()
returns trigger language plpgsql security definer as $$
begin
  if new.following_id <> new.follower_id then
    insert into public.notifications (recipient_id, actor_id, type)
    values (new.following_id, new.follower_id, 'follow');
  end if;
  return new;
end $$;

create trigger notify_on_follow
  after insert on public.follows
  for each row execute function public.notify_on_follow();

-- 3c. A new comment -> notify the video owner (top-level 'comment'),
--     the parent comment's author (a 'reply'), and anyone mentioned as
--     "@username" in the body ('mention').
create or replace function public.notify_on_comment()
returns trigger language plpgsql security definer as $$
declare
  target uuid;
  p record;
begin
  if new.parent_id is null then
    select user_id into target from public.videos where id = new.video_id;
    if target is not null and target <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, video_id, comment_id)
      values (target, new.user_id, 'comment', new.video_id, new.id);
    end if;
  else
    select user_id into target from public.comments where id = new.parent_id;
    if target is not null and target <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, video_id, comment_id)
      values (target, new.user_id, 'reply', new.video_id, new.id);
    end if;
  end if;

  if new.body is not null then
    for p in select id, username from public.profiles where username is not null loop
      if p.id <> new.user_id
         and position(lower('@' || p.username) in lower(new.body)) > 0 then
        insert into public.notifications (recipient_id, actor_id, type, video_id, comment_id)
        values (p.id, new.user_id, 'mention', new.video_id, new.id);
      end if;
    end loop;
  end if;

  return new;
end $$;

create trigger notify_on_comment
  after insert on public.comments
  for each row execute function public.notify_on_comment();

-- 4. Let the app subscribe to new notifications in real time (unread badge).
alter publication supabase_realtime add table public.notifications;
