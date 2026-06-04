"use client";

import PeoplePanel from "./PeoplePanel";

export default function SetupTab({ online }: { online: boolean | null }) {
  return (
    <div className="space-y-4">
      <PeoplePanel />
      <div
        className={`rounded-lg border p-4 ${
          online
            ? "border-green-200 bg-green-50"
            : "border-slate-200 bg-white"
        }`}
      >
        <h3 className="font-semibold">
          {online ? "✅ Connected to your database" : "💾 Saving on this device"}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {online
            ? "Your tasks and emails are stored in Supabase and sync everywhere you sign in."
            : "Right now your tasks save in this browser — no setup needed, it just works. They stay here on this device. Want them to follow you across phone and laptop, or to pull in real Outlook emails? Those upgrades are optional and can be added later."}
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold">Optional upgrades (later, no rush)</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          <li>
            <span className="font-medium">Sync across devices</span> — connect a
            free Supabase database so the same list shows on every device.
          </li>
          <li>
            <span className="font-medium">Real emails &amp; tasks</span> —
            connect Microsoft 365 to automatically pull in your flagged Outlook
            emails and To&nbsp;Do tasks every morning.
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          Full instructions live in the project README. You don&apos;t need any
          of this to use the dashboard today.
        </p>
      </div>
    </div>
  );
}
