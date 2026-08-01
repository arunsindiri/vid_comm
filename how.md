# How VidTalk Was Built

This file records everything done in the project — what was built and how.
It is updated on every git push so it always reflects the latest progress.

---

## 2026-08-01

### What we have done so far

We are in **Phase 0 (Planning)** of the roadmap. No application code exists yet.
So far we have created the project documents:

| # | File | What it is |
|---|------|-----------|
| 1 | `README.md` | Project title (`vid_comm`) |
| 2 | `vidtalk_readme.md` | Project identity, development principles, mission |
| 3 | `ROADMAP.md` | The full plan: Phases 0–18 |
| 4 | `how.md` | This file — a record of how the project is being built |

### How we did it

1. **Commit 1 — "first commit"** (`15e074d`)
   - Created `README.md` with the project name `vid_comm`.
   - Pushed the initial repo so the project is on GitHub.

2. **Commit 2 — "Add VidTalk readme"** (`c269e8c`)
   - Created `vidtalk_readme.md` defining what VidTalk is:
     - A mobile-first video sharing platform.
     - Community interacts through text comments, short video comments,
       and threaded video conversations anchored to timestamps.
   - Recorded 5 development principles:
     - End User Experience First
     - Meaningful Variables
     - No Duplicate Code (DRY)
     - Correctness
     - Best Solution
   - Recorded the mission: video conversations are the primary experience.

3. **Commit 3 — "Add development roadmap"** (`e851f82`)
   - Created `ROADMAP.md` with 19 phases (Phase 0 → Phase 18):
     - Planning, Setup, Authentication, Profile, Upload, Home Feed,
       Video Player, Search, Likes, Subscribe, Text Comments,
       Video Comments (the unique feature), Threaded Replies,
       Notifications, Watch History, Playlists, Optimization, Testing, Release.
   - Added development rules: one feature at a time, test after every
     small change, commit after every completed feature.

### The workflow we follow

Every step follows the same loop:

1. Learn
2. Build
3. Test
4. Fix
5. Commit
6. Repeat

---

## 2026-08-01 (later)

### What we have done so far

We finished **Phase 1 (Project Setup)**. The app now exists and opens.

We did **not** need to install Node.js — it was already installed
(Node v24, npm 11, git 2.53).

### How we did it

1. **Created the Expo project**
   - Ran `npx create-expo-app@latest mobile --template default`.
   - This created the `mobile/` folder containing a ready-to-run
     React Native app with:
     - **TypeScript** — type checking built in.
     - **Expo Router** — the file-based navigation system
       (screens live inside `src/app/`).
   - We answered "Yes" to skip creating a new git repository, because
     the project already has one at the top level.

2. **Renamed the app to VidTalk**
   - Edited `mobile/app.json`:
     - `name`: `mobile` → `VidTalk`
     - `slug`: `mobile` → `vidtalk`
     - `scheme`: `mobile` → `vidtalk`
   - This is the identity of the app (what it is called, its URL
     scheme, and its build name).

3. **Verified the app works**
   - Ran `npx tsc --noEmit` → no TypeScript errors.
   - Ran `npx expo start` → Metro bundler started and served the app.
   - Ran `npx expo export` → the whole app bundled successfully and
     produced 4 routes (Home, Explore, Sitemap, Not-found).

### What is inside `mobile/` right now

| Path | What it is |
|------|-----------|
| `app.json` | App configuration (name, icons, splash screen, plugins) |
| `src/app/` | The screens of the app (Expo Router uses this folder) |
| `src/components/` | Reusable UI pieces (buttons, themed text, etc.) |
| `src/constants/` | Shared values like colors and theme |
| `src/hooks/` | Reusable logic (like detecting dark/light mode) |
| `src/global.css` | Global styles for the app |
| `assets/` | Images and icons used by the app |
| `package.json` | The list of libraries (dependencies) the app uses |
| `tsconfig.json` | TypeScript settings |
| `scripts/` | Helper scripts (e.g. to reset the template project) |

### What the template screens look like

- `src/app/index.tsx` — the home screen shown when the app opens.
- `src/app/explore.tsx` — a second "explore" screen.
- `src/app/_layout.tsx` — the root layout that wraps all screens.

In Expo Router, every file in `src/app/` automatically becomes a page.
This is how we will add screens later (for example a login screen would
be `src/app/login.tsx`).

### Next steps

- Start **Phase 2 (Authentication)**: let users create an account and
  log in (Register, Login, Logout, Forgot Password).

---

## Git History

| Commit | Message | What it did |
|--------|---------|-------------|
| `15e074d` | first commit | Created `README.md` |
| `c269e8c` | Add VidTalk readme | Created `vidtalk_readme.md` |
| `e851f82` | Add development roadmap | Created `ROADMAP.md` |
| *(next)* | Setup Expo project | Created the `mobile/` Expo app (TypeScript + Expo Router) |

---

## Rule

Every time we push to GitHub, this file must be updated with what was done
and how it was done before the push.
