"use client";

const STEPS: { title: string; body: string }[] = [
  {
    title: "1 · Supabase",
    body: "Create a project (Mumbai / ap-south-1), run supabase/migrations/001_init.sql in the SQL editor, then copy the Project URL, anon key and service-role key into your env vars.",
  },
  {
    title: "2 · Microsoft 365",
    body: "Register an app in Azure AD, add the delegated Graph permissions (Mail.Read, Mail.ReadWrite, Tasks.Read, Tasks.ReadWrite, User.Read), grant admin consent, then store the client ID / secret / tenant ID and a refresh token.",
  },
  {
    title: "3 · Vercel",
    body: "Deploy with `vercel`, add every env var (Production + Preview + Development), connect the GitHub repo for auto-deploy, and confirm vercel.json's 8am IST cron is picked up.",
  },
  {
    title: "4 · Power Automate (optional)",
    body: "Add a daily 8am recurrence that does an HTTP GET to /api/refresh with `Authorization: Bearer <CRON_SECRET>` as a second trigger path.",
  },
];

export default function SetupTab() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        This dashboard is data-driven from Supabase and synced from Microsoft
        365. Work through these once and the 8am cron keeps it current.
      </p>
      <ul className="space-y-3">
        {STEPS.map((s) => (
          <li
            key={s.title}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <h3 className="font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.body}</p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-400">
        Full instructions live in README.md. Endpoints: /api/refresh (sync),
        /api/webhook (Power Automate push).
      </p>
    </div>
  );
}
