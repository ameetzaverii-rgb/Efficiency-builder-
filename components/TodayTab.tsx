"use client";

import { useState } from "react";
import type { Email, Task } from "@/lib/types";
import { getBrief, setEmailStatus, setTaskStatus } from "@/lib/store";

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export default function TodayTab({
  tasks,
  emails,
  onChanged,
}: {
  tasks: Task[];
  emails: Email[];
  onChanged: () => void;
}) {
  const topTasks = [...tasks]
    .sort(
      (a, b) =>
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
    )
    .slice(0, 5);

  const markDone = async (id: string) => {
    await setTaskStatus(id, "done");
    onChanged();
  };

  const markReplied = async (id: string) => {
    await setEmailStatus(id, "replied");
    onChanged();
  };

  const [brief, setBrief] = useState<string | null>(null);
  const [briefBusy, setBriefBusy] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const generateBrief = async () => {
    setBriefBusy(true);
    setBriefError(null);
    try {
      setBrief(await getBrief());
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : "Brief failed");
    } finally {
      setBriefBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">☀ Morning brief</h2>
          <button
            onClick={generateBrief}
            disabled={briefBusy}
            className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {briefBusy ? "Thinking…" : brief ? "Refresh" : "Generate brief"}
          </button>
        </div>
        {briefError && (
          <p className="mt-2 text-sm text-red-600">{briefError}</p>
        )}
        {brief ? (
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-700">
            {brief}
          </pre>
        ) : (
          !briefBusy && (
            <p className="mt-2 text-sm text-slate-500">
              One AI-written screen of what needs you today — decisions,
              pipeline moves, and what may be slipping.
            </p>
          )
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Top priorities</h2>
          <span className="text-sm text-slate-500">{tasks.length} active</span>
        </div>
        {topTasks.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing active. Clear desk.</p>
        ) : (
          <ul className="space-y-2">
            {topTasks.map((t) => (
              <li
                key={t.id}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.project} · {t.priority}
                  </p>
                </div>
                <button
                  onClick={() => markDone(t.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  Done
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Flagged emails</h2>
          <span className="text-sm text-slate-500">{emails.length} pending</span>
        </div>
        {emails.length === 0 ? (
          <p className="text-sm text-slate-500">Inbox zero on flags.</p>
        ) : (
          <ul className="space-y-2">
            {emails.slice(0, 5).map((e) => (
              <li
                key={e.id}
                className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3"
              >
                <div>
                  <p className="font-medium">{e.subject}</p>
                  <p className="text-xs text-slate-500">{e.from_name}</p>
                </div>
                <button
                  onClick={() => markReplied(e.id)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                >
                  Replied
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </div>
  );
}
