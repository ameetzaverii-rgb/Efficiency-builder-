# GSL Command Center

A persistent, full-stack daily command center for GSL Innovation Factory. Pulls
flagged emails and tasks from Microsoft 365, displays them in a structured
dashboard, logs every action to a Supabase (Postgres) database, and surfaces a
full historical timeline.

**Stack:** Next.js 14 · TypeScript · Supabase (Postgres) · Vercel

---

## Repository layout

```
app/
  layout.tsx
  page.tsx                 # main dashboard (renders CommandCenter)
  globals.css
  api/
    refresh/route.ts       # M365 sync — Vercel cron target (CRON_SECRET)
    tasks/route.ts         # CRUD (GET active / POST / PATCH / DELETE)
    emails/route.ts        # CRUD (GET pending / POST / PATCH status)
    history/route.ts       # read log (GET, newest first)
    webhook/route.ts       # Power Automate push (WEBHOOK_SECRET)
components/
  CommandCenter.tsx        # root shell + tabs + data loading
  TodayTab.tsx
  TasksTab.tsx
  EmailsTab.tsx
  HistoryTab.tsx
  SetupTab.tsx
lib/
  supabase.ts              # browser + service-role server clients
  microsoft-graph.ts       # OAuth token + Graph fetch helpers
  types.ts                 # Task / Email / HistoryEvent / TaskAction
supabase/migrations/
  001_init.sql             # full schema
vercel.json                # cron: 8am IST daily (30 2 * * * UTC)
```

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev                  # http://localhost:3000
```

The UI degrades gracefully without credentials, but the API routes need a real
Supabase project to return data.

## 1 · Supabase

1. supabase.com → **New project**. Name `gsl-command-center`, region
   `ap-south-1` (Mumbai). Save the database password.
2. Open the SQL editor and run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql).
3. Settings → API → copy the **Project URL**, **anon key**, and
   **service-role key** into your env vars.

## 2 · Microsoft 365 (Azure AD)

1. portal.azure.com → Azure Active Directory → App registrations → **New**.
   - Name: `GSL Command Center`
   - Account type: this organizational directory only
   - Redirect URI: `https://your-app.vercel.app/api/auth/callback`
2. Add **delegated** Microsoft Graph permissions and **grant admin consent**:
   `Mail.Read`, `Mail.ReadWrite`, `Tasks.Read`, `Tasks.ReadWrite`, `User.Read`.
3. Certificates & secrets → new client secret → copy the value.
4. Complete an OAuth login once to obtain a refresh token and set
   `MICROSOFT_REFRESH_TOKEN`.

## 3 · Environment variables

See [`.env.example`](.env.example). Required:

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser client |
| `SUPABASE_SERVICE_ROLE_KEY` | server client (API routes) |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` / `MICROSOFT_TENANT_ID` | Graph app |
| `MICROSOFT_REFRESH_TOKEN` | Graph token exchange |
| `CRON_SECRET` | protects `/api/refresh` |
| `WEBHOOK_SECRET` | protects `/api/webhook` |

## 4 · Vercel deploy

```bash
npm i -g vercel
vercel
```

Then in the dashboard: add every env var (Production + Preview + Development),
connect the GitHub repo for auto-deploy, and confirm the cron in `vercel.json`
(`30 2 * * *` UTC = 8:00am IST) is registered.

## 5 · Power Automate (optional second trigger)

Recurrence → every day → 8:00am IST → HTTP **GET**
`https://your-app.vercel.app/api/refresh` with header
`Authorization: Bearer <CRON_SECRET>`. Optionally post the response summary to
Teams.

## API reference

| Endpoint | Methods | Notes |
| --- | --- | --- |
| `/api/tasks` | GET, POST, PATCH, DELETE | GET returns `status = active` |
| `/api/emails` | GET, POST, PATCH | GET returns `status = pending` |
| `/api/history` | GET | newest first |
| `/api/refresh` | GET | M365 sync; requires `CRON_SECRET` |
| `/api/webhook` | POST | `{ type, data }`; requires `WEBHOOK_SECRET` |

---

Built for GSL Innovation Factory · Ameet Zaveri.
