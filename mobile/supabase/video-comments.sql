-- Video Comments (Phase 11) — VidTalk's unique feature
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- A video comment is a comment whose body is a short video, optionally
-- anchored to a timestamp in the video being commented on.
-- We extend the existing `comments` table so text and video can coexist.

-- 1. A comment can now be a video reply, so the text body is optional.
alter table public.comments
  alter column body drop not null;

-- 2. New fields for video replies.
alter table public.comments
  add column if not exists cloudinary_public_id text,
  add column if not exists video_url text,
  add column if not exists thumbnail_url text,
  add column if not exists duration_seconds integer,
  add column if not exists timestamp_seconds double precision;
