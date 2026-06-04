"use client";

import { useState } from "react";
import type { Email, Task } from "@/lib/types";
import { setEmailStatus, setTaskStatus } from "@/lib/store";
import IntelligencePanel from "./IntelligencePanel";
import DelegatePanel from "./DelegatePanel";

type Item =
  | { kind: "email"; id: string; title: string; sub: string; rank: number; email: Email }
  | { kind: "task"; id: string; title: string; sub: string; rank: number; task: Task };

const PRANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

export default function DecisionQueueTab({
  tasks,
  emails,
  onChanged,
}: {
  tasks: Task[];
  emails: Email[];
  onChanged: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const items: Item[] = [
    ...emails.map((e) => ({
      kind: "email" as const,
      id: e.id,
      title: e.subject,
      sub: `${e.from_name}${e.tag ? ` · ${e.tag}` : ""}`,
      rank: e.tag === "action" || e.tag === "flagged" ? 0 : 1,
      email: e,
    })),
    ...tasks
      .filter((t) => t.priority === "urgent" || t.priority === "high")
      .map((t) => ({
        kind: "task" as const,
        id: t.id,
        title: t.title,
        sub: `${t.project} · ${t.priority}`,
        rank: PRANK[t.priority] ?? 2,
        task: t,
      })),
  ].sort((a, b) => a.rank - b.rank);

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Nothing waiting on you right now. 🎉
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        Everything waiting on <strong>your</strong> decision, most important
        first. Open one to get the AI&apos;s context + multiple-choice options.
      </p>
      <ul className="space-y-2">
        {items.map((it) => {
          const open = openId === it.id;
          return (
            <li
              key={it.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        it.kind === "email"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {it.kind}
                    </span>
                    <p className="font-medium">{it.title}</p>
                  </div>
                  <p className="text-xs text-slate-500">{it.sub}</p>
                </div>
                <button
                  onClick={() => setOpenId(open ? null : it.id)}
                  className="shrink-0 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                >
                  {open ? "Close" : "Decide"}
                </button>
              </div>

              {open && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  <IntelligencePanel
                    entityType={it.kind}
                    entityId={it.id}
                    entityTitle={it.title}
                  />
                  <div className="flex flex-wrap gap-2">
                    {it.kind === "email" ? (
                      <>
                        <button
                          onClick={async () => {
                            await setEmailStatus(it.id, "replied");
                            onChanged();
                          }}
                          className="rounded-md border border-green-300 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50"
                        >
                          ✓ Mark handled
                        </button>
                        <button
                          onClick={async () => {
                            await setEmailStatus(it.id, "dismissed");
                            onChanged();
                          }}
                          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
                        >
                          Dismiss
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          await setTaskStatus(it.id, "done");
                          onChanged();
                        }}
                        className="rounded-md border border-green-300 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        ✓ Done
                      </button>
                    )}
                    <DelegatePanel
                      entityType={it.kind === "email" ? "email" : "task"}
                      entityId={it.id}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
