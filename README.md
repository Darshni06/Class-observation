# Kamala Niketan — Class Observation Portal

A web portal for recording Montessori classroom observations, sharing structured
feedback with teachers, and generating AI-assisted reports via Groq (free tier).

- **Admin portal** (`/admin`) — record observations, manage teachers & classes,
  generate AI reports, export data.
- **Teacher portal** (`/teacher`) — read-only view of feedback, progress, and
  shared reports for their class.

**Tech stack:** React + Vite, Firebase (Auth + Firestore), Groq API
(free tier, hosted Llama models) for AI report generation, `xlsx` +
`file-saver` for Excel export, `docx` + `file-saver` (+ `jszip` for bulk
export) for Word export.

**Observations belong to a class, not an individual teacher.** A class can
have more than one teacher assigned (e.g. two co-teachers); any observation
recorded for that class, and any report generated from it, is automatically
visible to every teacher currently assigned to that class.

This guide assumes no prior Firebase/Vercel experience — follow it top to bottom.

---

## 0. If you're upgrading an existing deployment

This version gives teachers full create/edit/delete access to observations
and reports **for their own class only** (previously read-only), and adds an
admin "Teacher Observations" comparison page. To pick this up on an existing
Firebase project:

1. **Redeploy `firestore.rules`** — Firebase Console → Firestore → Rules →
   paste the new file → Publish. Without this, teachers will get
   `permission-denied` the moment they try to save anything.
2. No Firestore data migration is needed — older observations/reports
   without a `createdByRole` field are automatically treated as admin-authored.

## 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `kamala-niketan-observation`) → continue through the steps
   (Google Analytics is optional, you can disable it) → **Create project**.

### 1.1 Enable Authentication

1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Email/Password** → **Save**.

### 1.2 Create the Firestore database

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** → pick a location close to you → **Enable**.

### 1.3 Deploy the security rules

1. Still in Firestore, go to the **Rules** tab.
2. Open `firestore.rules` from this project, copy its entire contents, paste it
   into the console's rules editor (replacing what's there), and click **Publish**.

### 1.4 Register a Web App

1. In the left sidebar, click the gear icon → **Project settings**.
2. Scroll to **Your apps** → click the **`</>`** (Web) icon.
3. Give it a nickname (e.g. `web`) → **Register app**. You do **not** need
   Firebase Hosting.
4. Firebase will show you a `firebaseConfig` object — keep this tab open, you'll
   need these values in Step 3.

### 1.5 Create your first Admin account

The portal has no public sign-up screen (by design — only admins create
accounts), so the very first admin must be created manually:

1. **Authentication → Users → Add user.** Enter your email and a password →
   **Add user**. Copy the **User UID** that appears next to the new user.
2. **Firestore Database → Start collection.**
   - Collection ID: `users`
   - Document ID: paste the **User UID** you copied
   - Add these fields:
     | Field | Type | Value |
     |---|---|---|
     | `name` | string | Your name |
     | `email` | string | The email you just used |
     | `role` | string | `admin` |
   - Click **Save**.

You can now sign in to `/login` with that email/password, selecting the
**Admin** tab. Once signed in as admin, use the **Teachers** page in the app
to create teacher accounts — you never need to repeat this manual step for
teachers.

---

## 2. Get a Groq API key (free)

1. Go to <https://console.groq.com/keys> → sign in → **Create API Key** →
   copy it.
2. This key powers the "Generate with AI" button on the report page. Groq's
   free tier is generous for this kind of usage; check current limits on the
   same console page.
3. The model used is `llama-3.3-70b-versatile` (set in
   `src/utils/geminiService.js` as `GROQ_MODEL`) — change that one constant
   if you want a different hosted model (Groq lists available model names on
   their console/docs).

> **Security note:** because this is a pure frontend app (no backend server),
> the Groq key is shipped to the browser. For a school-internal tool this is
> a reasonable trade-off; rotate the key immediately if you ever suspect it
> has leaked.

> **Don't confuse Groq with Grok** — Groq (console.groq.com) is the free-tier
> inference host this app uses; Grok (console.x.ai) is a different, paid
> product by xAI. If you ever see a "team doesn't have credits" error, you're
> pointed at the wrong one.

---

## 3. Configure environment variables locally

1. In the project folder, copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in:
   - The six `VITE_FIREBASE_*` values from Step 1.4's `firebaseConfig` object.
   - `VITE_GROQ_API_KEY` from Step 2.
3. **Never commit `.env`** — it's already in `.gitignore`.

---

## 4. Run it locally

You'll need [Node.js](https://nodejs.org) 18+ installed.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`) and sign
in with the admin account you created in Step 1.5.

---

## 5. Push to your GitHub repository (fresh start)

You mentioned you want to wipe the old contents of
`https://github.com/Darshni06/Class-observation.git` and push this project in
its place, without ever committing `node_modules` or other build artifacts.

```bash
# 1. Move into the new project folder
cd kamala-niketan-observation

# 2. Start a brand-new git history (avoids dragging old commits/files along)
rm -rf .git
git init
git add .
git commit -m "Class Observation Portal: initial commit"

# 3. Point it at your existing GitHub repo
git remote add origin https://github.com/Darshni06/Class-observation.git

# 4. Force-push, replacing everything that was there before
git branch -M main
git push -f origin main
```

`.gitignore` already excludes `node_modules/`, `dist/`, `.env`, and editor/OS
junk files, so none of that will ever be pushed — `git status` should only ever
show your real source files as new/changed.

---

## 6. Deploy to Vercel

1. Go to <https://vercel.com> → sign in (you can use your GitHub account).
2. **Add New → Project → Import** your `Class-observation` GitHub repo.
3. Framework preset: Vercel should auto-detect **Vite** — leave build command
   as `npm run build` and output directory as `dist`.
4. Before clicking Deploy, expand **Environment Variables** and add every
   variable from your `.env` file (same names, same values):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GROQ_API_KEY`
5. Click **Deploy**. After it finishes, Vercel gives you a live URL
   (e.g. `class-observation.vercel.app`).
6. **Authorize the domain in Firebase:** Firebase Console → Authentication →
   Settings → **Authorized domains → Add domain** → paste your Vercel URL
   (without `https://`). Without this step, login will fail on the live site.

Any future `git push` to `main` automatically redeploys on Vercel.

---

## 7. Using the portal

### As Admin
- **Dashboard** — totals and average scores at a glance.
- **New Observation** — pick a **class** (its assigned teacher(s) are shown
  read-only — no need to also pick a teacher, since the observation belongs to
  the class itself), plus observer/date/time/duration, followed by every
  parameter from the school's observation template, grouped by category, each
  with a level (3/2/1) and a large remarks box. Save as **Draft** or **Save &
  Publish** (only published observations become visible in the teacher
  portal — to every teacher on that class).
- **All Observations** — filter by teacher/class/status/date range or search;
  Edit, generate a Report, or Delete any row.
- **Generate Report** — pick a **class**, tick the observations to
  summarize, label the period, then **Generate with AI**. Review the draft,
  **Save Report**, then **Export Word** or **Share** it so every teacher on
  that class can see it in their portal.
- **Export** — bulk-export filtered observations to Excel (`.xlsx`) and
  filtered reports to Word (single `.docx`, or a `.zip` of `.docx` files
  when more than one matches). The Excel export lays each observation out
  on its own worksheet in the exact Section / Parameter / Scale / Level /
  Remarks format of the school's original observation template.
- **Teachers** — create accounts (with a temporary password you share with the
  teacher) and assign each teacher to one class.
- **Classes** — create classes manually and assign **one or more** teachers
  per class (chip list with add/remove) from either this page or the
  Teachers page; both stay in sync automatically. Adding a teacher who is
  already assigned elsewhere moves them to the new class.

### As Teacher
The teacher portal now has two sections in the sidebar:

**Record & Report** — full parity with the admin's recording tools, but
automatically scoped to the teacher's own class (no class picker needed):
- **New Observation**, **All Observations**, **Generate Report**, **Export**
  — identical functionality to the admin pages of the same name. A teacher's
  own reports are visible to them immediately; an admin-authored report only
  appears once the admin explicitly shares it from the admin's Generate
  Report page.

**My Overview** — the original read-only views, scoped to published data only:
- **My Feedback** — one tab per published observation date.
- **My Progress** — average score per category, plus score history.
- **My Reports** — reports shared with (or generated by) this class.

### As Admin — Teacher Observations (new)
A dedicated analysis page: pick a class and see every observation/report a
teacher has submitted about their own class, plus a side-by-side average-by-
category comparison against the admin's own observations for that class.
Useful for spotting where a teacher's self-assessment lines up with — or
diverges from — the admin's outside view.

---

## 8. Known limitations (by design, given a pure-frontend stack)

- **Deleting a teacher** removes their portal profile and class assignment,
  but cannot delete the underlying Firebase Auth account from the browser
  (that requires the Admin SDK, i.e. a server). To fully remove the account,
  delete it manually in Firebase Console → Authentication → Users.
- **No automated emails** for new teacher accounts — share the temporary
  password yourself. The Edit Teacher modal has a **"Send password reset
  email"** button if a teacher wants to set their own password afterward.
- **PDF export** uses your browser's native print dialog ("Print / Save as
  PDF" button on the Export page) rather than a dedicated PDF library, to keep
  the dependency list minimal.
- **Teacher portal queries must filter by status/sharedWithTeacher in the
  query itself**, not just client-side — this is already done in
  `services.js` (`getObservationsByClass`, `getReportsByClass`). If you ever
  add a new teacher-facing query, keep this pattern: Firestore rejects an
  entire query outright if it can't prove every possible result satisfies the
  security rules, so the query's `where()` clauses must match what the rule
  checks. (An earlier version of this app didn't do this and the teacher
  dashboard spun forever on a silent `permission-denied` — if that ever
  happens again, check this first.)

---

## 9. Project structure

```
src/
  data/observationParams.js   ← all categories/parameters from the Excel template
  firebase/config.js          ← Firebase init
  firebase/services.js        ← every Firestore/Auth read & write
  contexts/AuthContext.jsx    ← current user + portal profile
  contexts/ToastContext.jsx   ← global toast notifications
  utils/exportExcel.js        ← observations → .xlsx
  utils/exportWord.js         ← reports → .docx / .zip
  utils/geminiService.js      ← Groq prompt + API call (filename kept for minimal diff)
  components/                 ← Layout, shared UI, modals
  pages/admin/                ← Dashboard, New/All Observations, Reports, Export, Teachers, Classes
  pages/teacher/               ← My Feedback, My Progress, My Reports
```
