# VidTalk Beginner Development Roadmap

> Goal:
> Build a complete video sharing application step by step while learning backend and mobile development.
>
> Rule:
> Never build two features at the same time.
> Finish one feature completely before moving to the next.

---

# Phase 0 - Planning

## Goal

Understand what we are building.

### Features

- User Authentication
- User Profiles
- Upload Videos
- Watch Videos
- Home Feed
- Search
- Likes
- Subscriptions
- Text Comments
- Video Comments
- Timestamp Comments
- Notifications
- Watch History
- Playlists

Do NOT start coding yet.

---

# Phase 1 - Project Setup

## Goal

Create the project.

Tasks

- Install Node.js
- Install Expo
- Create React Native project
- Install TypeScript
- Install Expo Router
- Connect GitHub
- Create project folders
- Run first application

Checkpoint

✅ App opens successfully.

---

# Phase 2 - Authentication

Goal

Users should be able to create an account and log in.

Features

- Register
- Login
- Logout
- Forgot Password

Learn

- Authentication
- Sessions
- Tokens

Checkpoint

✅ User can login successfully.

---

# Phase 3 - User Profile

Goal

Each user has a profile.

Features

- Profile Photo
- Username
- Bio
- Followers
- Following

Checkpoint

✅ Profile page works.

---

# Phase 4 - Video Upload

Goal

Creators upload videos.

Learn

- Pick video
- Compress
- Upload
- Save metadata

Store

Video -> Cloudinary

Metadata -> Supabase

Checkpoint

✅ Uploaded video appears in database.

---

# Phase 5 - Home Feed

Goal

Display uploaded videos.

Learn

- Fetch data
- FlatList
- Pagination

Features

- Home Feed
- Infinite Scroll

Checkpoint

✅ Users can browse videos.

---

# Phase 6 - Video Player

Goal

Play uploaded videos.

Features

- Play
- Pause
- Seek
- Fullscreen

Checkpoint

✅ Videos play smoothly.

---

# Phase 7 - Search

Features

- Search videos
- Search users

Checkpoint

✅ Search works.

---

# Phase 8 - Likes

Features

- Like
- Unlike

Checkpoint

✅ Like count updates.

---

# Phase 9 - Subscribe

Features

- Subscribe
- Unsubscribe

Checkpoint

✅ Subscription works.

---

# Phase 10 - Text Comments

Features

- Add comment
- Edit comment
- Delete comment

Checkpoint

✅ Comments work.

---

# Phase 11 - Video Comments ⭐

This is VidTalk's unique feature.

Features

- Record video
- Upload video
- Attach timestamp
- Display comment

Checkpoint

✅ Users can reply using videos.

---

# Phase 12 - Threaded Replies

Features

- Reply to comments
- Reply to video comments
- Nested replies

Checkpoint

✅ Conversations work.

---

# Phase 13 - Notifications

Features

- Likes
- Replies
- Mentions
- New Followers

Checkpoint

✅ Notifications received.

---

# Phase 14 - Watch History

Features

- Recently watched
- Continue watching

Checkpoint

✅ History works.

---

# Phase 15 - Playlists

Features

- Create playlist
- Add video
- Remove video

Checkpoint

✅ Playlist works.

---

# Phase 16 - Optimization

Learn

- Lazy Loading
- Pagination
- Caching
- Image Optimization
- Video Optimization

Checkpoint

✅ App feels fast.

Done

- Pagination was already in place (feed infinite scroll, `listVideos` limit/range).
- Image Optimization: Cloudinary thumbnails now serve `f_auto` + `q_auto`
  (WebP/AVIF) — ~56% smaller; higher-res `w_1280` poster on the player;
  `expo-image` `cachePolicy="memory-disk"` + `recyclingKey` on feed cards.
- Video Optimization: playback URL uses Cloudinary `q_auto` (~87% smaller
  delivery); posters sharpened.
- Caching: Home feed pages cached in-memory with a 60s TTL, so re-focusing
  the tab doesn't refetch the same data; pull-to-refresh bypasses the cache
  and a new upload clears it.

---

# Phase 17 - Testing

Test

- Authentication
- Upload
- Feed
- Comments
- Video Comments
- Search

Fix bugs.

---

# Phase 18 - Release

- Build APK
- Test on Android
- Publish

---

# Development Rules

Rule 1

Build ONE feature at a time.

Rule 2

Never copy code without understanding it.

Rule 3

Test after every small change.

Rule 4

Commit code to GitHub after every completed feature.

Example

Setup Completed

↓

git commit

↓

Authentication Completed

↓

git commit

↓

Video Upload Completed

↓

git commit

Rule 5

If something breaks, fix it before adding a new feature.

Rule 6

Always ask:

"Does this feature work completely?"

before moving forward.

---

# Learning Path

While building this project, learn these topics in order:

1. Git & GitHub
2. React Native Basics
3. TypeScript
4. Expo Router
5. Components
6. State Management
7. Navigation
8. Forms
9. Supabase
10. PostgreSQL
11. Cloudinary
12. Authentication
13. File Upload
14. APIs
15. Performance
16. Deployment

---

# Success Formula

Learn

↓

Build

↓

Test

↓

Fix

↓

Commit

↓

Repeat

Never rush.

A complete app built slowly is far better than an incomplete app built quickly.

This project is a marathon, not a sprint.
