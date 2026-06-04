"use client";

import { useState } from "react";
import { delegationNote } from "@/lib/store";

/** Draft a delegation note with AI and hand it off via Microsoft Teams. */
export default function DelegatePanel({
  entityType,
  entityId,
}: {
  entityType: "email" | "task";
  entityId: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draft = async () => {
    setBusy(true);
    setError(null);
    try {
      setNote(await delegationNote({ entityType, entityId, toName: name || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft");
    } finally {
      setBusy(false);
    }
  };

  const teamsLink = () => {
    const msg = encodeURIComponent(note);
    const users = email ? encodeURIComponent(email) : "";
    return `https://teams.microsoft.com/l/chat/0/0?users=${users}&message=${msg}`;
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-blue-300 px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50"
      >
        → Delegate via Teams
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/40 p-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Person name (e.g. Namrata)"
          className="w-40 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-ink"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="their @getsetlearn.info email"
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-ink"
        />
        <button
          onClick={draft}
          disabled={busy}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy ? "Drafting…" : "✦ Draft note"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {note && (
        <>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-ink"
          />
          <div className="flex flex-wrap gap-2">
            <a
              href={teamsLink()}
              target="_blank"
              rel="noreferrer"
              className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                email ? "bg-[#4b53bc] hover:opacity-90" : "pointer-events-none bg-slate-300"
              }`}
            >
              ⬢ Open in Teams &amp; send
            </a>
            <button
              onClick={() => navigator.clipboard?.writeText(note)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-white"
            >
              Copy note
            </button>
            {!email && (
              <span className="self-center text-xs text-slate-400">
                add their email to enable Teams
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
