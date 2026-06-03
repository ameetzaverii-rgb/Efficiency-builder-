"use client";

import { useState } from "react";
import type { Email, EmailStatus } from "@/lib/types";

export default function EmailsTab({
  emails,
  onChanged,
}: {
  emails: Email[];
  onChanged: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const setStatus = async (id: string, status: EmailStatus) => {
    await fetch("/api/emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    onChanged();
  };

  if (emails.length === 0) {
    return <p className="text-sm text-slate-500">No pending emails.</p>;
  }

  return (
    <ul className="space-y-2">
      {emails.map((e) => (
        <li
          key={e.id}
          className="rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex items-start justify-between">
            <button
              className="text-left"
              onClick={() => setOpenId(openId === e.id ? null : e.id)}
            >
              <p className="font-medium">{e.subject}</p>
              <p className="text-xs text-slate-500">
                {e.from_name}
                {e.from_email ? ` · ${e.from_email}` : ""} · {e.received_date}
              </p>
            </button>
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setStatus(e.id, "replied")}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                Mark replied
              </button>
              <button
                onClick={() => setStatus(e.id, "dismissed")}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
              >
                Dismiss
              </button>
            </div>
          </div>

          {openId === e.id && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {e.summary && (
                <p className="text-sm text-slate-600">{e.summary}</p>
              )}
              {e.draft && (
                <div className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">
                  <p className="mb-1 text-xs font-semibold text-slate-500">
                    Suggested draft
                  </p>
                  {e.draft}
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
