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

## 2026-08-02

### What we have done so far

We finished **Phase 2 (Authentication)** — the first real feature.
Users can now sign in with their Google account and log out. The rest
of the app is protected: if you are not signed in, you only see the
login screen.

Decisions made along the way:

- **Google-only login.** The client asked us to use Google
  authentication, so we removed the email/password screens.
- **Supabase as the backend.** Supabase gives us free Google sign-in,
  a database, and file storage — everything the roadmap needs later.

### Step 1 — Added Supabase to the project

1. **Installed the packages**
   - `@supabase/supabase-js` — talks to the Supabase server.
   - `@react-native-async-storage/async-storage` — stores the login
     session on the phone so the user stays logged in.
   - `expo-auth-session` + `expo-web-browser` — help the "Sign in with
     Google" screen open and come back to our app.
   - Installed with `npx expo install` so the versions match Expo.

2. **Created a Supabase project**
   - Created a new project on https://supabase.com.
   - Copy-pasted its **Project URL** and **anon key** into
     `mobile/.env` (the file that holds secret settings).
   - `mobile/.env` is in `.gitignore` so the key is never uploaded to
     GitHub. We also made `mobile/.env.example` with fake values so
     anyone knows which settings to fill in.

3. **Created the client** — `mobile/src/lib/supabase.ts`
   - This file creates the `supabase` object that every screen uses.
   - Told it where to store the session (`AsyncStorage`).
   - Enabled **PKCE** (`flowType: 'pkce'`) — a secure way of swapping
     the Google login code for a session.
   - Enabled `detectSessionInUrl` so the app can read the login result
     from the browser address bar on the web.

### Step 2 — Turned on Google sign-in in Supabase

1. In the Supabase dashboard: **Authentication → Providers → Google**.
2. Created a **Google OAuth client** at
   https://console.cloud.google.com with:
   - Client ID: `696579369214-khcv8mbfvfam33bhc6g7un7v6890ct69.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-...`
3. Pasted both into Supabase and saved.
4. At first Google sign-in failed with **"provider is not enabled"**.
   Fix: we had only created the OAuth client; we still had to flip the
   "Enable Sign in with Google" toggle on. After that, Google worked.

### Step 3 — Built the authentication state (the "brain")

Created `mobile/src/context/auth-context.tsx`:

- **Holds the session** — who is logged in right now.
- **`isLoading`** — true while the app is checking for a saved login.
- **`signOut()`** — clears the session locally first (so logout feels
  instant), then tells the server to end the session too.
- Listens to Supabase events (`onAuthStateChange`) so every screen
  updates automatically when someone logs in or out.

### Step 4 — Built the login screen

1. **`mobile/src/app/login.tsx`**
   - The main login page. It has one big "Continue with Google"
     button.
   - On the **web** it does a full-page redirect to Google and comes
     back to our app with the login result.
   - On **phone/Expo Go** it opens the Google screen in a popup and
     exchanges the returned code for a session.

2. **`mobile/src/components/auth/auth-screen.tsx`**
   - The shared frame for auth pages (title, subtitle, form area).
   - Reused by the login screen (and any future auth screens).

3. **`mobile/src/components/auth/google-sign-in-button.tsx`**
   - The "Continue with Google" button with the Google logo and a
     spinner while loading.
   - Added `assets/images/google-logo.png`.

### Step 5 — Protected the rest of the app

1. **Moved the app screens into `mobile/src/app/(tabs)/`**
   - `(tabs)/index.tsx` = Home, `(tabs)/explore.tsx` = Explore.
   - Moved them inside a `(tabs)` folder — an Expo Router "group"
     that keeps them behind a bottom tab bar.
   - Deleted the old `src/app/index.tsx` and `src/app/explore.tsx`.

2. **`mobile/src/app/_layout.tsx`** — the route guard
   - Wraps everything in `AuthProvider`.
   - New `RootNavigator` watches the session:
     - No session + not on login page → send to `/login`.
     - Session exists + on login page → send to Home `/`.

### Step 6 — Log out button

- Added a **Log out** button on the Home screen
  (`(tabs)/index.tsx`).
- It calls `signOut()`, which clears the session. The route guard
  immediately redirects back to the login screen.

### Problems we faced and how we fixed them

| Problem | What happened | How we fixed it |
|---------|--------------|-----------------|
| "Unsupported provider: provider is not enabled" | Google OAuth client was created but Google was still off in Supabase | Flipped the "Enable Sign in with Google" toggle in Supabase → Authentication → Providers |
| Log out button did nothing | The animated splash overlay was drawn on top of everything and swallowed the tap | Added `pointerEvents="none"` to the overlay so clicks pass through it |
| Splash screen never disappeared on some loads | The animation finish callback wasn't always firing | Added a fallback timer that hides the overlay after the animation duration |
| Google login opened but returned to `localhost:3000` and showed "site can't be reached" | Supabase only allows redirecting back to its default URL (`http://localhost:3000`), and our app was on port 8081 | Run the web app on port 3000 (`expo start --web --port 3000`) so the callback lands back on our app |
| Login code never completed after redirect | The page had `#access_token=` (old "implicit" flow) but our code looked for `?code=` (PKCE) | Switched the client to PKCE + `detectSessionInUrl` so both match |
| Popup login was unreliable on web | Browsers warn about popups (`Cross-Origin-Opener-Policy`) | On web we now do a full-page redirect to Google instead of a popup; the popup is only used on phones |

### How to run it

1. `cd mobile`
2. `npm run web` → opens the app at `http://localhost:3000`
   (port 3000 is important — it is the URL Supabase allows for login).
3. Click **Continue with Google**, pick an account → you land on the
   Home screen saying "YOU ARE LOGGED IN".
4. Click **Log out** → back to the login screen.

### Next steps

- **Phase 3 (User Profile)**: show the logged-in user's profile, and
  use the Google account info (name, email, photo) they gave us.
- Later: try the same login flow on the phone via Expo Go (the
  `vidtalk://` redirect scheme is already registered for it).

---

## 2026-08-02 (later)

### What we have done so far

We deployed the app to the internet on **Netlify** so the client can
open it in any browser — no Expo Go, no install needed.

**Live URL: https://fastidious-flan-9dac94.netlify.app**

We also made the splash screen impossible to get stuck on.

### Step 1 — Fixed the splash screen hanging forever

- The splash overlay already had a fallback timer, but only started
  after the animation began. If the animation never started, the
  overlay stayed forever.
- Fix: added a **safety timer** that force-hides the overlay after a
  maximum of 2.5 seconds no matter what
  (`MAX_OVERLAY_DURATION` in `animated-icon.tsx`).
- Now the splash can never block the app, whatever Expo Go does.

### Step 2 — Deployed the web app to Netlify

1. Built the web version of the app:
   - `npx expo export --platform web` → produced a `dist/` folder
     (the whole app as static files: HTML, JS, images).
2. Installed the Netlify CLI (as a dev dependency, since global
   installs needed sudo):
   - `npm install --save-dev netlify-cli`
3. Logged in to Netlify and deployed:
   - `./node_modules/.bin/netlify login`
   - `./node_modules/.bin/netlify deploy --dir dist --prod`
4. The site went live at
   **https://fastidious-flan-9dac94.netlify.app**
   (Netlify gives a random site name — we can change it to a nicer
   name like `vidtalk.netlify.app` later if we want).
5. Added `.netlify/` (local Netlify state) to `.gitignore` so it is
   never committed.

### Problems we faced and how we fixed them (deployment round)

| Problem | What happened | How we fixed it |
|---------|--------------|-----------------|
| Expo Go said "Project is incompatible with this version of Expo Go" | The phone's Expo Go app was older than the SDK 57 the project needs | Updated Expo Go from the Google Play Store |
| App stuck on splash in Expo Go with "New update available, downloading..." | Expo Go was downloading a patch to its own runtime and would not run the app until it finished | This is Expo Go updating itself, not the app. Waited / retried; the splash safety timer now guarantees our app never hangs regardless |
| `netlify login` failed with a `FetchError` to api.netlify.com | The network resolves Netlify to IPv6 addresses that cannot be reached, and Node's fetch could not fall back to IPv4 | Created `ipv4-dns-workaround.js`, a small script that forces Node to use IPv4 DNS lookup, then ran login with `NODE_OPTIONS="--require ./ipv4-dns-workaround.js"` |
| Google login on the live site redirected to `http://localhost:3000` instead of the Netlify URL | Supabase only allows redirecting back to its configured Site URL (`http://localhost:3000`); the Netlify URL was not in the allowed list | Add `https://fastidious-flan-9dac94.netlify.app` to **Supabase → Authentication → URL Configuration → Redirect URLs** (and optionally set it as Site URL) |

### How the client can see it

1. Open **https://fastidious-flan-9dac94.netlify.app** in any browser.
2. Click **Continue with Google** → pick an account.
3. Lands on the Home screen ("YOU ARE LOGGED IN").
4. Click **Log out** → back to login.

> Note: Google login on the live URL only works after the Netlify URL
> is added to Supabase's allowed redirect URLs (see the table above).

### Next steps

- Add the Netlify URL to Supabase redirects (one dashboard setting).
- Give the site a nicer Netlify name (e.g. `vidtalk`).
- **Phase 3 (User Profile)**: use the Google account info
  (name, email, photo) to show a real profile page.

---

## 2026-08-03

### What we have done so far

We finished **Phase 3 (User Profile)**. Users can now view their profile
(photo, username, bio) and edit it — change username, write a bio, and
upload a photo from their device. The changes are saved to Supabase and
persist after logout/login and page reloads.

Decisions made along the way:

- **Profiles live in a `profiles` table** in Supabase, one row per user,
  linked to the auth user (`id references auth.users`).
- **The app shows Google's info by default** until the user edits their
  profile (so the page never looks empty).
- **No followers/following in this phase** — the client decided to leave
  that for a later phase.

### Step 1 — Created the database (`mobile/supabase/profiles.sql`)

The user ran this file in **Supabase → SQL Editor** (result: "Success.
No rows returned" — expected). It does four things:

1. **Profiles table** — `id` (references `auth.users`), `username`
   (unique), `bio`, `avatar_url`, `created_at`, `updated_at`.
2. **Auto-profile trigger** — `handle_new_user()` creates a profile row
   automatically whenever a *new* user signs up (uses their Google name
   and photo). Wired up with `on_auth_user_created`.
3. **Row Level Security** — everyone can *read* any profile; a user can
   only *insert* or *update* their own row.
4. **Storage bucket** — a public `avatars` bucket with policies so
   anyone can view avatar images but only the owner can upload/update.

### Step 2 — Built the profile library (`mobile/src/lib/profile.ts`)

Three small functions the screens use:

- `getProfile(userId)` — loads one user's profile (null if none).
- `updateProfile(userId, updates)` — saves username/bio/avatar.
- `uploadAvatar(userId, uri)` — uploads a photo to the `avatars` bucket
  and returns its public URL.

### Step 3 — Built the two screens

1. **`mobile/src/app/(tabs)/profile.tsx`** — the Profile tab.
   - Shows the avatar (circle), username, and bio.
   - Falls back to the Google name/photo when no profile exists yet.
   - **Refetches every time the tab gains focus** (see problem below).
   - Has an **Edit Profile** button that opens the edit screen.

2. **`mobile/src/app/edit-profile.tsx`** — the edit screen.
   - Tap the avatar → pick a photo from the device
     (`expo-image-picker`, installed with `npx expo install`).
   - Username + Bio fields with a **Save** / **Cancel**.
   - Save uploads a new photo (if picked) then calls `updateProfile`,
     then goes back to the Profile tab.

3. **Registered the Profile tab** — added a `profile` trigger in
   `mobile/src/components/app-tabs.tsx` **and**
   `mobile/src/components/app-tabs.web.tsx` (see problem below), added
   `assets/images/tabIcons/profile{,@2x,@3x}.png`, and registered the
   `edit-profile` screen in `src/app/_layout.tsx`.

### Step 4 — Deployed to Netlify again

- `npx tsc --noEmit` (passes) → `npx expo export --platform web` →
  `./node_modules/.bin/netlify deploy --dir dist --prod`
- Live again at **https://fastidious-flan-9dac94.netlify.app**.

### Problems we faced and how we fixed them (Phase 3)

| Problem | What happened | How we fixed it |
|---------|--------------|-----------------|
| Profile tab was not visible in the navigation | The app uses **two** tab bar files: the phone version had the Profile trigger, but the **web** version (`app-tabs.web.tsx`) still only had Home and Explore | Added the same `<TabTrigger name="profile" href="/profile">` to the web tab bar |
| "Save changes" seemed to do nothing | The profile row did **not** exist. The auto-create trigger only fires on *new signups*, and this Google account was created before the trigger existed, so re-logging in never created a row. The `update` then silently affected 0 rows | Changed `updateProfile` to **upsert** (insert if missing, update if present) via `onConflict: 'id'`, and added an `INSERT` policy to the SQL so the upsert is allowed |
| Save failed with a row-level security error | The upsert can insert a new row, but only an `UPDATE` policy existed — inserting was blocked by RLS | Added `create policy "Users can insert their own profile" ... with check (auth.uid() = id)` to `profiles.sql` and ran just that statement in the SQL Editor |
| Profile tab still showed the old/default info right after saving | Tab screens stay mounted in Expo Router, so the Profile tab never re-ran its `getProfile` when we returned from the edit screen — it only showed fresh data after a full page reload | Switched the Profile tab to `useFocusEffect` (from `expo-router`) so it refetches from the DB every time it comes back into focus |
| Uploaded avatar URL was malformed (`.../avatar.app/<uuid>`) | On the web the image picker returns a `blob:` URI, and the old code guessed the file extension by splitting the URI on `.` — which produced the garbage name `avatar.app/<uuid>` (stored in a valid but ugly path) | Derive the extension from the file's MIME type (`blob.type`) instead, defaulting to `jpg`; now files are stored as `avatar.jpg` / `avatar.png` etc. |

### How to test it (live site)

1. Open **https://fastidious-flan-9dac94.netlify.app** (hard refresh).
2. Log in with Google.
3. Profile tab → shows your Google name/photo, "No bio yet".
4. Edit Profile → change username, add a bio, pick a photo → Save.
5. The Profile tab updates **immediately** and the changes survive a
   page reload and logout/login.

> Tip: the profile row is created automatically the first time you save
> (upsert), even for accounts made before the trigger existed.

### Next steps

- **Phase 4 (Upload)**: record/pick a video and upload it to Supabase.
- Remember to hard-refresh after each deploy (browser caching can show
  an old bundle).

---

## 2026-08-03 (later)

### What we have done so far

We finished **Phase 4 (Video Upload)**. Creators can now pick a video
from their device, give it a title and description, and upload it. The
video is stored in **Cloudinary** (as the roadmap planned) and its
metadata is saved in a new `videos` table in Supabase.

Checkpoint achieved: **an uploaded video now appears in the database.**

### Step 1 — Chose where videos live

- The roadmap says videos go to **Cloudinary**, metadata to Supabase.
- We asked the client which they preferred; they chose **Cloudinary**.
- The client already had a Cloudinary account, so we used it:
  - Cloud name: `tmf6kiy9`
  - Upload preset: `video_comments` (set to **Unsigned**, so the app can
    upload without a secret key — safe because the preset only allows
    uploads, and the app is public).
- Added the two values to `mobile/.env` as `EXPO_PUBLIC_CLOUDINARY_*`.

### Step 2 — Created the videos table (`mobile/supabase/videos.sql`)

The user ran this in the Supabase SQL Editor. It creates:

- A **`videos` table**: `id`, `user_id` (links to `auth.users`),
  `title`, `description`, `cloudinary_public_id`, `video_url`,
  `thumbnail_url`, `duration_seconds`, `created_at`.
- **Row Level Security**: anyone can read videos; only the owner can
  insert/update/delete their own rows.

### Step 3 — Built the upload library (`mobile/src/lib/video.ts`)

- `uploadVideoToCloudinary(input)` — uploads the file to Cloudinary's
  `/video/upload` endpoint with the unsigned preset, using `FormData`.
  Works on web (a `File`/`Blob`) and native (a `{ uri, ... }` file).
  Returns the Cloudinary public id and the secure video URL.
- `saveVideo(...)` — inserts the metadata row into the `videos` table.

### Step 4 — Built the Upload screen (`mobile/src/app/(tabs)/upload.tsx`)

- A new **Upload** tab (added to both tab bars, native + web, with a
  generated `upload` tab icon).
- **Pick a video** via `expo-image-picker` (`mediaTypes: ['videos']`)
  → shows the file name, size, and duration.
- **Title** (required) and **Description** inputs.
- **Upload** button → uploads to Cloudinary → saves metadata → shows
  "Your video has been saved to the database."
- On the web, blob URLs are revoked when leaving the screen to avoid
  memory leaks.

### Step 5 — Deployed and verified

1. First deploy built without the Cloudinary values in the bundle —
   `process.env.EXPO_PUBLIC_*` values were missing even though the
   Supabase ones were present. Fix: **clear Metro's transform cache**
   with `npx expo export --platform web --clear`, then redeploy.
2. Verified the unsigned preset worked with a test upload to Cloudinary
   (the "Unsupported video format" error for a fake file proved the
   request passed the preset check).
3. The client uploaded a real test video on the live site: title
   "testing video", 10 seconds long. It appears in the `videos` table
   and Cloudinary serves it as `video/mp4` (HTTP 200).

### Problems we faced and how we fixed them (Phase 4)

| Problem | What happened | How we fixed it |
|---------|--------------|-----------------|
| Upload preset or cloud name wrong? | We tested the preset by uploading a dummy file and got "Unsupported video format or file" | This is expected for a non-video file — the request passed the unsigned-preset check (a bad preset would return a different auth error). Cloudinary accepted the request; only the file content was invalid |
| Cloudinary values missing from the deployed bundle | The exported JS contained the Supabase keys but not the new `EXPO_PUBLIC_CLOUDINARY_*` values, even though they were in `.env` | Re-ran `npx expo export --platform web --clear` to clear Metro's cached transform of the env, then redeployed. Values then appeared in the bundle |
| Video upload failed mid-way | (covered above) | Use small videos to test; Cloudinary transcodes on upload so big files are slow |

### How to test it (live site)

1. Open **https://fastidious-flan-9dac94.netlify.app** (hard refresh).
2. Log in with Google → click the **Upload** tab.
3. **Pick a video** (a small MP4) → add a **Title** → **Upload**.
4. See "Your video has been saved to the database."
5. Checkpoint: the row now exists in the `videos` table in Supabase.

### Next steps

- **Phase 5 (Home Feed)**: fetch uploaded videos and show them on the
  Home tab (cards with title, creator, thumbnail/player).

---

## 2026-08-03 (even later)

### What we have done so far

We finished **Phase 5 (Home Feed)**. The Home tab is no longer the
template screen — it is now a real video feed. Uploaded videos appear
as cards (thumbnail, title, creator name, duration, upload time) newest
first, with infinite scroll.

Checkpoint achieved: **users can browse videos.**

### Step 1 — Added a foreign key for the creator join

`mobile/supabase/feed.sql` (run in the Supabase SQL Editor):

- `videos.user_id` → `profiles(id)` foreign key, so the feed can pull
  the uploader's username + avatar in the same query.
- An index on `videos.created_at` so "newest first" queries stay fast.

### Step 2 — Extended the video library (`mobile/src/lib/video.ts`)

- `listVideos({ page, limit })` — fetches one page of videos newest
  first, joined with the creator's profile (`profiles!videos_user_profile_fkey`),
  and reports `hasMore` so the feed knows when to stop.
- `getVideoThumbnailUrl(video)` — builds a Cloudinary thumbnail frame
  URL from the video's public id.

### Step 3 — Built the VideoCard component

`mobile/src/components/video-card.tsx` — one feed card:

- 16:9 thumbnail (or a placeholder when missing) with a duration badge
  ("0:10") in the corner.
- Creator avatar (Google photo or initial), title, and "creator ·
  51m ago" line.

### Step 4 — Rewrote the Home tab as the feed

`mobile/src/app/(tabs)/index.tsx`:

- `FlatList` with **infinite scroll** (`onEndReached` loads the next
  page of 10) and **pull-to-refresh**.
- Refetches the first page whenever the Home tab gains focus, so a
  freshly uploaded video shows up right away.
- Loading spinner, an empty state ("No videos yet…"), and an error state.

Also:

- **Moved the Log out button to the Profile tab** (Home is now the
  feed, so it no longer has the template logout button).
- **Upload screen safety**: before saving a video we now upsert the
  profile row first, so the new foreign key can never block an upload
  for an account that somehow has no profile row.

### Step 5 — Deployed and verified

1. Deployed, then ran the feed query directly against Supabase — it
   failed until the `feed.sql` foreign key was created in the SQL
   Editor ("could not find a relationship").
2. The client hard-refreshed and confirmed the feed: one video card
   ("testing video" / "arun kumar" / 51m ago / 0:10) with working tabs.
3. The thumbnail was blank. Root cause: Cloudinary returned `400` for
   `v_169` + `c_fill`. Fix: switched the thumbnail URL to
   `so_0.5/w_640/h_360/c_fill` (HTTP 200, `image/jpeg`) and redeployed.

### Problems we faced and how we fixed them (Phase 5)

| Problem | What happened | How we fixed it |
|---------|--------------|-----------------|
| Feed query returned "Could not find a relationship between 'videos' and 'profiles'" | The join needs a real foreign key in the database, which the user had not created yet | Ran `mobile/supabase/feed.sql` in the Supabase SQL Editor to add the `videos_user_profile_fkey` constraint and the `created_at` index |
| Video thumbnail was blank/gray | The Cloudinary thumbnail URL used `v_169` + `c_fill`, which Cloudinary rejects (HTTP 400) | Tested several transformations with curl and used the one that returns a real image: `so_0.5/w_640/h_360/c_fill/<public_id>.jpg` |
| Video does not play when tapping a card | Playback is not part of Phase 5 — it is Phase 6 (Video Player) in the roadmap | Expected for now; Phase 6 will open/play the video when a card is tapped |

### How to test it (live site)

1. Open **https://fastidious-flan-9dac94.netlify.app** (hard refresh).
2. Home tab shows uploaded videos as cards (thumbnail, title, creator).
3. Scroll down to trigger infinite scroll when more than 10 exist.
4. Log out now lives on the **Profile** tab.

### Next steps

- **Phase 6 (Video Player)**: tapping a card opens and plays the video
  (web + native) with a proper full-screen player.

---

## 2026-08-03 (final)

### What we have done so far

We finished **Phase 6 (Video Player)**. Tapping a video card in the
Home feed now opens a full player screen where the video plays with
sound and standard controls.

Checkpoint achieved: **videos play smoothly** (play, pause, seek,
fullscreen all work).

### Step 1 — Installed expo-video

- `npx expo install expo-video` (SDK 57, works on Android/iOS/web and
  in Expo Go). It also registered its config plugin in `app.json`.

### Step 2 — Added a fetch-by-id helper (`mobile/src/lib/video.ts`)

- `getVideo(id)` — loads one video joined with its creator profile,
  used by the player screen.

### Step 3 — Built the player screen (`mobile/src/app/video/[id].tsx`)

- A dynamic route `/video/[id]` (Expo Router auto-registers it).
- Uses `useVideoPlayer` (starts with a `null` source, then
  `player.replace(video_url)` once the video metadata is loaded) and
  `VideoView` with **native controls** enabled — that single prop gives
  us play, pause, seek bar, and a **fullscreen button**
  (`fullscreenOptions={{ enable: true }}`), which is exactly the four
  Phase 6 features.
- Shows the thumbnail as a cover while the video is loading, a spinner,
  and an error message if playback fails.
- Below the player: title, "creator · time ago", and description.
- A **← Back** button returns to the feed.

### Step 4 — Made the feed cards tappable

- `mobile/src/components/video-card.tsx` — cards now navigate to
  `/video/<id>` instead of being disabled.

### Step 5 — Deployed and verified

1. Fixed a couple of typing issues found by `tsc`:
   - `useEvent` returns the event payload or `null` — access fields via
     optional chaining (`statusEvent?.status`).
   - `PlayerError` is an object, not a string — render
     `playerError?.message`.
2. Typed routes didn't include `/video/[id]` until a short
   `expo start` regenerated `.expo/types/router.d.ts`.
3. Exported with `--clear` and deployed to Netlify.
4. The client tested on the live site: tapping the card opens the
   player and the video **plays smoothly** with working pause, seek,
   and fullscreen.

### Problems we faced and how we fixed them (Phase 6)

| Problem | What happened | How we fixed it |
|---------|--------------|-----------------|
| Type errors in the player screen | `useEvent` returns `StatusChangeEventPayload \| null`, and `PlayerError` is an object not a string | Access status/error with optional chaining and render `playerError?.message` |
| `/video/[id]` not accepted by `router.push` in TypeScript | Typed routes are generated by Metro, not by `expo export`, so the new route was missing | Started `expo start` briefly to regenerate `.expo/types/router.d.ts`, then typecheck passed |

### How to test it (live site)

1. Open **https://fastidious-flan-9dac94.netlify.app** (hard refresh).
2. Home feed → tap a video card.
3. The video plays with play/pause, a seek bar, and fullscreen.

### Next steps

- **Phase 7 (Search)**: let users find videos by title/creator.

---

## 2026-08-03 (follow-up)

### What we have done so far

We added **Followers / Following** — the feature deferred from Phase 3
(the client originally chose to leave it out, then asked for it back).
Users can now follow/unfollow a creator from the video player screen,
and their Profile tab shows follower/following counts.

### Step 1 — Created the follows table (`mobile/supabase/follows.sql`)

Run in the Supabase SQL Editor. It creates:

- A **`follows` table**: `follower_id` + `following_id` (both reference
  `profiles.id`, compound primary key so a person can only be followed
  once), plus `created_at`.
- **Row Level Security**: everyone can read any follow; only the
  follower themselves can insert/delete their own follow rows.
- A check so users **cannot follow themselves**
  (`auth.uid() = follower_id and follower_id <> following_id`).

### Step 2 — Built the follow library (`mobile/src/lib/follow.ts`)

- `isFollowing(followerId, followingId)` — is this viewer following this
  creator?
- `follow(...)` / `unfollow(...)` — insert/delete a follow row.
- `getFollowCounts(profileId)` — how many followers and how many people
  they follow (two exact-count queries).

### Step 3 — Follow button on the video player

- The creator profile now returns its `id` too (`getVideo` / `listVideos`
  select `creator:profiles!(id, username, avatar_url)`).
- `mobile/src/app/video/[id].tsx` shows a **Follow / Unfollow** button
  next to the creator name — only when viewing someone else's video.
  The state is loaded on open and toggles instantly, and the UI
  reflects it after a reload too.

### Step 4 — Counts on the Profile tab

- `mobile/src/app/(tabs)/profile.tsx` now shows **Followers N** and
  **Following N** under the username, refreshed whenever the tab gains
  focus.

### Step 5 — Deployed and verified

1. Typechecked, exported (`--clear`), deployed to Netlify.
2. The client ran `follows.sql`, then tested on the live site:
   following from the player screen works and persists after reload,
   and the Profile tab shows the updated counts.

### How to test it (live site)

1. Open **https://fastidious-flan-9dac94.netlify.app** (hard refresh).
2. Open a video from someone else → **Follow** next to the creator.
3. It becomes **Unfollow** and stays that way after a reload.
4. Profile tab → see **Followers / Following** counts.

### Next steps

- **Phase 7 (Search)**: let users find videos by title/creator.
- Later (Phase 11 "Subscribe"): a Home feed toggle that only shows
  videos from creators you follow.

---

## Git History

| Commit | Message | What it did |
|--------|---------|-------------|
| `15e074d` | first commit | Created `README.md` |
| `c269e8c` | Add VidTalk readme | Created `vidtalk_readme.md` |
| `e851f82` | Add development roadmap | Created `ROADMAP.md` |
| `6ea4fb3` | Setup Expo project | Created the `mobile/` Expo app (TypeScript + Expo Router) |
| `8ad2268` | Add Google sign-in with Supabase | Phase 2: Google-only login, logout, and protected routes |
| `03745a6` | Deploy web app to Netlify | Live URL + splash screen safety timer + deployment fixes |
| `d9a2235` | Add user profile | Phase 3: profiles table/trigger/RLS, profile library, Profile + Edit Profile screens, profile tab (native + web), image picker |
| `a7c46f9` | Add video upload | Phase 4: videos table + RLS, Cloudinary upload library, Upload tab/screen, upload tab icon |
| `f5a08d7` | Add home feed | Phase 5: FK videos→profiles + index, listVideos with pagination, VideoCard, feed Home tab with infinite scroll, logout moved to Profile, thumbnail URL fix |
| `d437539` | Add video player | Phase 6: expo-video install + config plugin, getVideo(id), `/video/[id]` player screen with native controls + fullscreen, tappable feed cards |
| *(pending)* | Add follow system | follows table + RLS (no self-follow), follow.ts library, Follow/Unfollow on player screen, follower/following counts on Profile tab |

---

## Rule

Every time we push to GitHub, this file must be updated with what was done
and how it was done before the push.
