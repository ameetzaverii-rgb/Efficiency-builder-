"use client";

import type { HistoryEvent } from "@/lib/types";

const LABELS: Record<string, string> = {
  task_added: "Task added",
  task_completed: "Task completed",
  task_deleted: "Task deleted",
  email_replied: "Email replied",
  email_dismissed: "Email dismissed",
  email_drafted: "AI reply drafted",
  decision_delegate: "Delegated",
  decision_defer: "Deferred",
  seed: "Loaded starter data",
  refresh: "M365 sync",
  refresh_failed: "M365 sync failed",
};

export default function HistoryTab({ history }: { history: HistoryEvent[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-slate-500">No events logged yet.</p>;
  }

  return (
    <ol className="relative space-y-3 border-l border-slate-200 pl-4">
      {history.map((h) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-slate-400" />
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-medium">
              {LABELS[h.event_type] ?? h.event_type}
              {h.entity_title ? (
                <span className="font-normal text-slate-600">
                  {" "}
                  — {h.entity_title}
                </span>
              ) : null}
            </p>
            <time className="text-xs text-slate-400">
              {new Date(h.created_at).toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
