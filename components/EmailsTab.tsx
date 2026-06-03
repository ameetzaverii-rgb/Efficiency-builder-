"use client";

import { useState } from "react";
import type { Email, EmailStatus } from "@/lib/types";
import { draftReply, logDecision, setEmailStatus } from "@/lib/store";

export default function EmailsTab({
  emails,
  onChanged,
}: {
  emails: Email[];
  onChanged: () => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<Record<string, string>>({});

  const setStatus = async (id: string, status: EmailStatus) => {
    await setEmailStatus(id, status);
    onChanged();
  };

  const generate = async (email: Email) => {
    setBusyId(email.id);
    setError(null);
    try {
      const draft = await draftReply(email.id, instructions[email.id]);
      setDrafts((d) => ({ ...d, [email.id]: draft }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft failed");
    } finally {
      setBusyId(null);
    }
  };

  const decide = async (email: Email, decision: string) => {
    await logDecision({
      entityId: email.id,
      entityTitle: email.subject,
      decision,
    });
    onChanged();
  };

  const mailtoLink = (email: Email) => {
    const to = email.from_email ?? "";
    const subject = email.subject.startsWith("Re:")
      ? email.subject
      : `Re: ${email.subject}`;
    const body = drafts[email.id] ?? email.draft ?? "";
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  if (emails.length === 0) {
    return <p className="text-sm text-slate-500">No pending emails.</p>;
  }

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <ul className="space-y-2">
        {emails.map((e) => {
          const open = openId === e.id;
          const draft = drafts[e.id] ?? e.draft ?? "";
          return (
            <li
              key={e.id}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  className="text-left"
                  onClick={() => setOpenId(open ? null : e.id)}
                >
                  <p className="font-medium">{e.subject}</p>
                  <p className="text-xs text-slate-500">
                    {e.from_name}
                    {e.from_email ? ` · ${e.from_email}` : ""} · {e.received_date}
                    {e.tag ? ` · ${e.tag}` : ""}
                  </p>
                </button>
                <button
                  onClick={() => setOpenId(open ? null : e.id)}
                  className="shrink-0 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                >
                  {open ? "Close" : "Open & decide"}
                </button>
              </div>

              {open && (
                <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                  {e.summary && (
                    <p className="text-sm text-slate-600">{e.summary}</p>
                  )}

                  {/* AI draft */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => generate(e)}
                        disabled={busyId === e.id}
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {busyId === e.id
                          ? "Drafting…"
                          : draft
                          ? "✦ Redraft with AI"
                          : "✦ Draft reply with AI"}
                      </button>
                      <input
                        value={instructions[e.id] ?? ""}
                        onChange={(ev) =>
                          setInstructions((m) => ({
                            ...m,
                            [e.id]: ev.target.value,
                          }))
                        }
                        placeholder="optional: tell the AI how to reply (e.g. 'politely decline')"
                        className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-ink"
                      />
                    </div>

                    {draft && (
                      <>
                        <textarea
                          value={draft}
                          onChange={(ev) =>
                            setDrafts((d) => ({ ...d, [e.id]: ev.target.value }))
                          }
                          rows={8}
                          className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-ink"
                        />
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={mailtoLink(e)}
                            className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                          >
                            ✉ Open in email & send
                          </a>
                          <button
                            onClick={() =>
                              navigator.clipboard?.writeText(draft)
                            }
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                          >
                            Copy reply
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Decision buttons */}
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    <span className="self-center text-xs font-medium text-slate-400">
                      Decision:
                    </span>
                    <button
                      onClick={() => setStatus(e.id, "replied")}
                      className="rounded-md border border-green-300 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50"
                    >
                      ✓ Replied
                    </button>
                    <button
                      onClick={() => decide(e, "delegate")}
                      className="rounded-md border border-blue-300 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50"
                    >
                      → Delegate
                    </button>
                    <button
                      onClick={() => decide(e, "defer")}
                      className="rounded-md border border-amber-300 px-2.5 py-1 text-xs text-amber-700 hover:bg-amber-50"
                    >
                      ⏰ Defer
                    </button>
                    <button
                      onClick={() => setStatus(e.id, "dismissed")}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      Dismiss
                    </button>
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
