"use client";

import { useCallback, useEffect, useState } from "react";
import type { Email, EmailStatus } from "@/lib/types";
import {
  draftReply,
  getAnalyzedIds,
  getHandledEmails,
  logDecision,
  setEmailStatus,
} from "@/lib/store";
import IntelligencePanel from "./IntelligencePanel";
import DelegatePanel from "./DelegatePanel";

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

  const [showHandled, setShowHandled] = useState(false);
  const [handled, setHandled] = useState<Email[]>([]);
  const [loadingHandled, setLoadingHandled] = useState(false);
  const [analyzedIds, setAnalyzedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAnalyzedIds().then(setAnalyzedIds);
  }, [emails]);

  const loadHandled = useCallback(async () => {
    setLoadingHandled(true);
    try {
      setHandled(await getHandledEmails());
    } finally {
      setLoadingHandled(false);
    }
  }, []);

  useEffect(() => {
    if (showHandled) loadHandled();
  }, [showHandled, loadHandled]);

  const setStatus = async (id: string, status: EmailStatus) => {
    await setEmailStatus(id, status);
    onChanged();
    if (showHandled) loadHandled();
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

  const mailtoLink = (email: Email, draftText: string) => {
    const to = email.from_email ?? "";
    const subject = email.subject.startsWith("Re:")
      ? email.subject
      : `Re: ${email.subject}`;
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(draftText)}`;
  };

  return (
    <div>
      {/* Safety note — this app never sends email itself */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>Nothing here sends email by itself.</strong> AI only writes a
        draft for you to read and edit. The only way a reply goes out is{" "}
        <em>“✉ Open in email &amp; send”</em>, which opens your own Outlook so{" "}
        <strong>you</strong> press send. <em>“Mark handled”</em> just files an
        item away — it does not send anything.
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
          {error.includes("ANTHROPIC") && (
            <div className="mt-1 text-xs text-red-600">
              Add <code>ANTHROPIC_API_KEY</code> in Vercel → Settings →
              Environment Variables, then redeploy.
            </div>
          )}
        </div>
      )}

      {emails.length === 0 ? (
        <p className="text-sm text-slate-500">No pending emails. 🎉</p>
      ) : (
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="font-medium">{e.subject}</p>
                      {e.draft && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                          ✦ draft saved
                        </span>
                      )}
                      {analyzedIds.has(e.id) && (
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                          🔎 analyzed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {e.from_name}
                      {e.from_email ? ` · ${e.from_email}` : ""} ·{" "}
                      {e.received_date}
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

                    <IntelligencePanel entityType="email" entityId={e.id} />

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
                          placeholder="optional: how to reply (e.g. 'politely decline')"
                          className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-ink"
                        />
                      </div>

                      {draft && (
                        <>
                          <p className="text-xs font-medium text-slate-400">
                            Draft (review &amp; edit — not sent):
                          </p>
                          <textarea
                            value={draft}
                            onChange={(ev) =>
                              setDrafts((d) => ({
                                ...d,
                                [e.id]: ev.target.value,
                              }))
                            }
                            rows={8}
                            className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-ink"
                          />
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={mailtoLink(e, draft)}
                              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                            >
                              ✉ Open in email &amp; send
                            </a>
                            <button
                              onClick={() => navigator.clipboard?.writeText(draft)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                            >
                              Copy reply
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <span className="self-center text-xs font-medium text-slate-400">
                        File it:
                      </span>
                      <button
                        onClick={() => setStatus(e.id, "replied")}
                        className="rounded-md border border-green-300 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50"
                      >
                        ✓ Mark handled
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

                    <DelegatePanel entityType="email" entityId={e.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Handled / review section */}
      <div className="mt-6 border-t border-slate-200 pt-4">
        <button
          onClick={() => setShowHandled((s) => !s)}
          className="text-sm font-medium text-slate-600 hover:text-ink"
        >
          {showHandled ? "▾" : "▸"} Handled emails &amp; past drafts
        </button>

        {showHandled && (
          <div className="mt-3">
            {loadingHandled ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : handled.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nothing handled yet. Items you mark handled or dismiss appear
                here with their AI draft, so you can always review them.
              </p>
            ) : (
              <ul className="space-y-2">
                {handled.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{e.subject}</p>
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                        {e.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {e.from_name} · {e.received_date}
                    </p>
                    {e.draft ? (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-slate-400">
                          Saved draft:
                        </p>
                        <p className="mt-1 whitespace-pre-wrap rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700">
                          {e.draft}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={mailtoLink(e, e.draft)}
                            className="rounded-md border border-green-300 px-2.5 py-1 text-xs text-green-700 hover:bg-green-50"
                          >
                            ✉ Open in email
                          </a>
                          <button
                            onClick={() =>
                              navigator.clipboard?.writeText(e.draft ?? "")
                            }
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => setStatus(e.id, "pending")}
                            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-100"
                          >
                            Reopen
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs italic text-slate-400">
                        No AI draft was generated for this one.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
