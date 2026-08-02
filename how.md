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

## Git History

| Commit | Message | What it did |
|--------|---------|-------------|
| `15e074d` | first commit | Created `README.md` |
| `c269e8c` | Add VidTalk readme | Created `vidtalk_readme.md` |
| `e851f82` | Add development roadmap | Created `ROADMAP.md` |
| `6ea4fb3` | Setup Expo project | Created the `mobile/` Expo app (TypeScript + Expo Router) |
| `8ad2268` | Add Google sign-in with Supabase | Phase 2: Google-only login, logout, and protected routes |
| *(next)* | Deploy web app to Netlify | Live URL + splash screen safety timer + deployment fixes |

---

## Rule

Every time we push to GitHub, this file must be updated with what was done
and how it was done before the push.
