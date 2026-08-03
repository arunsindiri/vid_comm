-- Threaded Replies (Phase 12)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Replies are just comments with a parent. A comment can reply to any
-- other comment (text or video) on the same video, and replies can
-- themselves be replied to (nested threads).

alter table public.comments
  add column if not exists parent_id uuid
  references public.comments(id)
  on delete cascade;

-- Speed up "find the replies to this comment".
create index if not exists comments_parent_id_idx
  on public.comments (parent_id);
