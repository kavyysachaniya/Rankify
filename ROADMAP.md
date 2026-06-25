# Rankify — Supabase Integration & Feature Roadmap

## What This File Is
A beginner-friendly, step-by-step guide to integrate Supabase (auth + database) and a list of features to build next.

---

## Part A: Supabase Project Setup (in the Dashboard)

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up (GitHub login is easiest)
2. Click **"New project"**
3. Fill in:
   - **Project name:** `rankify`
   - **Database password:** Generate a strong one and save it (you won't need it in app code, but keep it safe)
   - **Region:** Pick the closest one to you (e.g. "South Asia (Mumbai)" for India)
4. Click "Create new project" — wait ~2 minutes

### Step 2: Get Your API Keys
1. Go to **Project Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon (public) key** — a long string starting with `eyJ...`

> The anon key is **safe for browser code**. It only allows operations your RLS policies permit. Never use the `service_role` key in frontend code.

### Step 3: Configure Authentication
1. Go to **Authentication → Providers** — make sure **Email** is enabled
2. Go to **Authentication → Settings** → **disable "Confirm email"** for development
   - Re-enable this before going to production
3. Set minimum password length to 6

### Step 4: Create Database Tables

Go to **SQL Editor** → **New query** → paste and run each block:

#### Profiles Table
Stores display names (Supabase Auth only stores email/password, not custom fields):

```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
```

#### Templates Table
Stores saved tier lists as JSONB (mirrors the current localStorage structure exactly):

```sql
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  data jsonb not null,
  saved_at timestamptz default now() not null
);

alter table public.templates enable row level security;

create policy "Users can read own templates"
  on public.templates for select using (auth.uid() = user_id);
create policy "Users can insert own templates"
  on public.templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates"
  on public.templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates"
  on public.templates for delete using (auth.uid() = user_id);

create index idx_templates_user_id on public.templates(user_id);
```

#### Auto-Create Profile on Signup (Trigger)
This automatically creates a profile row when a new user signs up:

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'User'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

> **Why RLS matters:** Row Level Security policies are like permission rules at the database level. Even if someone has your anon key, the database itself denies access to other users' data. Each policy checks `auth.uid() = user_id`.

> **Why `on delete cascade`:** If a user deletes their account, all their profiles and templates are automatically deleted too.

---

## Part B: Code Changes

### What Changes vs What Stays the Same

| Files that CHANGE | What happens |
|---|---|
| `hooks/useAuth.jsx` | Full rewrite — Supabase Auth + DB queries replace localStorage |
| `components/AuthScreen.jsx` | Username field becomes email field |
| `components/TemplateManager.jsx` | Sync operations become async with loading states |
| `package.json` | New dependency: `@supabase/supabase-js` |

| New files to CREATE | Purpose |
|---|---|
| `src/lib/supabase.js` | Supabase client singleton |
| `.env.local` | Your Supabase credentials (git-ignored) |
| `.env.example` | Documents required env vars (committed to git) |

| Files that DO NOT change | Why |
|---|---|
| `hooks/useTierList.js` | Editor state stays in localStorage — instant interaction |
| `App.jsx` | Already works with the new useAuth interface |
| All other components | No auth or template logic in them |
| `constants/`, `utils/` | Static data and utilities |

### Step 1: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Step 2: Create `.env.local` (git-ignored)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
Replace with your actual values from Step 2 above.

> Vite requires env vars to start with `VITE_` to be accessible in browser code.

### Step 3: Create `src/lib/supabase.js`
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Step 4: Rewrite `hooks/useAuth.jsx`

**What gets removed:**
- `hashPassword()` — Supabase uses bcrypt server-side (much more secure than browser SHA-256)
- `getUsers()` / `saveUsers()` — users live in Supabase's `auth.users` table
- `localStorage.getItem('rankify-current-user')` — replaced by `supabase.auth.getSession()`

**What gets added:**
- `supabase.auth.signUp()` with display_name in metadata
- `supabase.auth.signInWithPassword()` for login
- `supabase.auth.signOut()` for logout
- `onAuthStateChange` listener that keeps user state in sync (handles login, logout, token refresh, new tabs)
- `loadUserProfile()` helper that fetches display_name from the profiles table
- Template CRUD using `supabase.from('templates').select/insert/update/delete`

### Step 5: Update `components/AuthScreen.jsx`
- `username` state → `email` state
- Input `type="text"` → `type="email"`
- Placeholder → `"you@example.com"`
- Add `message` state for "check your email" flow (when email confirmation is enabled)
- All styling stays identical

### Step 6: Update `components/TemplateManager.jsx`
- `const templates = getTemplates()` (synchronous, every render) → `useState + useEffect` with async fetch
- Add `templatesLoading` state → show "Loading..." while fetching
- Add `saving` state → show "Saving..." and disable button during network request
- All handlers (`handleSave`, `handleLoad`, `handleDelete`) become `async`
- After save/delete, call `fetchTemplates()` to refresh list from database

### Step 7: Create `.env.example` (committed to git)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Part C: How to Verify It Works

After making all changes:

1. Run `npm run dev` and open the app
2. **Sign up** with email + display name + password
3. Check Supabase dashboard: **Auth → Users** should show your user, **Table Editor → profiles** should show your display name
4. **Save a template** → check **Table Editor → templates** for the JSONB data row
5. **Log out → log back in** → templates should still be there
6. **Open a different browser** → log in → same templates appear (cross-device sync!)
7. Active editor state still uses localStorage (refresh page = work preserved)

---

## Part D: Feature Ideas (What to Build Next)

### Priority Order (recommended)

#### 1. Password Reset (1 hour)
Add a "Forgot password?" link to the login screen. Calls `supabase.auth.resetPasswordForEmail(email)`. Supabase sends the email and handles the reset link automatically. Essential for any real auth system.

#### 2. Shareable Tier Lists (1-2 days)
The **killer social feature**. Generate a public link like `/s/abc123`. Create a `shared_lists` table with a unique slug. The shared view is read-only and doesn't require login. Users click "Share" → slug is generated → link is copied to clipboard.

#### 3. Template Thumbnails (half day)
When saving a template, use the existing `html2canvas` to capture a small screenshot. Store as base64 in the template JSONB. Show these thumbnails in the Load tab instead of just text — makes templates visual and easier to find.

#### 4. Undo/Redo (1 day)
The most-requested feature for any drag-and-drop editor. Maintain a state history stack in `useTierList.js`. Support Ctrl+Z / Ctrl+Y. Store the last 20 states.

#### 5. Google/GitHub OAuth (half day)
Configure OAuth providers in the Supabase dashboard. Add "Sign in with Google" / "Sign in with GitHub" buttons. Removes signup friction completely.

#### 6. Public Gallery (2-3 days)
A page showing recently shared tier lists from all users (opt-in). Browse, upvote, and clone others' tier lists. Transforms the app from a tool into a community.

---

### More Feature Ideas by Category

#### Quick Wins (hours each)
- **Duplicate template** — "Duplicate" button, inserts copy with "(Copy)" suffix
- **Template count badge** — show count on "Templates" button
- **Keyboard shortcuts** — Ctrl+S to save, Ctrl+Z for undo
- **Auto-fill template name** — remember last saved name

#### UX Improvements
- **Import/Export JSON** — download/upload templates as `.json` files for offline backup
- **Theme toggle** — dark/light mode switch
- **Drag to reorder tiers** — drag tier labels instead of using up/down buttons
- **Search/filter items** — useful when pool has many items

#### Data & Export
- **CSV export** — spreadsheet with Item/Tier/Position columns
- **Custom export settings** — choose dimensions, background, watermark toggle
- **Bulk import from CSV** — upload spreadsheet to create many items at once
- **Template marketplace** — pre-made templates (NBA teams, Marvel movies, etc.)

#### Mobile Improvements
- **Bottom sheet controls** — slide-up panel for mobile controls
- **Swipe gestures** — swipe to delete/load templates
- **Haptic feedback** — vibration on drag start and item placement

#### Advanced / Multi-Day
- **Supabase Storage for images** — move images from base64 to cloud storage (removes size limits)
- **Real-time collaborative editing** — Supabase Realtime channels for multi-user
- **PWA** — installable app with offline support
- **Comparison mode** — side-by-side view of two rankings

#### Gamification
- **Achievement badges** — "First Tier List", "10 Templates Saved", "Shared with 5 People"
- **Ranking streaks** — track daily activity, show streak badges
- **Community challenges** — weekly prompts ("Rank top 10 movies of 2025")
- **Tier list polls** — turn a list into a poll, show community consensus ranking
