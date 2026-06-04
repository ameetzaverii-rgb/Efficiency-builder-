"use client";

import { useCallback, useEffect, useState } from "react";
import type { Tracker } from "@/lib/types";
import { addTracker, deleteTracker, getTrackers } from "@/lib/store";
import IntelligencePanel from "./IntelligencePanel";

const STARTERS: { title: string; url: string; type: string }[] = [
  {
    title: "Client Tracker (SharePoint)",
    url: "https://maftechnologies-my.sharepoint.com/:u:/g/personal/swati_p_getsetlearn_info/IQC29_uZE1awQo69H-6oLpcFAWsuMIs336Alm388mrSARLc",
    type: "sharepoint",
  },
  {
    title: "Client Tracker (Live app)",
    url: "https://script.google.com/macros/s/AKfycbwW_H9H-bZOsNxrcDAgj19i4KEecuIBVqGTXOtbiZs7aarsHrdGQYdjkTxMQrb4MluUGw/exec",
    type: "appsscript",
  },
];

export default function TrackersTab() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [embedId, setEmbedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrackers(await getTrackers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (t: { title: string; url: string; type?: string }) => {
    setError(null);
    try {
      await addTracker(t);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add");
    }
  };

  const missingStarters = STARTERS.filter(
    (s) => !trackers.some((t) => t.url === s.url)
  );

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Your client trackers in one place. Open or embed them, and use the{" "}
        <strong>discussion</strong> on each to drop in related emails — then{" "}
        <strong>🔎 Analyze</strong> to synthesize a recommendation across all of
        it.
      </p>

      {missingStarters.length > 0 && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
          <p className="text-sm font-medium text-indigo-800">
            Add your trackers
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingStarters.map((s) => (
              <button
                key={s.url}
                onClick={() => add(s)}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              >
                + {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tracker name"
          className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… link"
          className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={() => {
            if (title.trim() && url.trim()) {
              add({ title: title.trim(), url: url.trim() });
              setTitle("");
              setUrl("");
            }
          }}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add tracker
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      {trackers.length === 0 ? (
        <p className="text-sm text-slate-500">No trackers yet.</p>
      ) : (
        <ul className="space-y-3">
          {trackers.map((t) => {
            const open = openId === t.id;
            return (
              <li
                key={t.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.title}</p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                        {t.type}
                      </span>
                    </div>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-xs text-indigo-600 hover:underline"
                    >
                      {t.url}
                    </a>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setEmbedId(embedId === t.id ? null : t.id)}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      {embedId === t.id ? "Hide" : "Embed"}
                    </button>
                    <button
                      onClick={() => setOpenId(open ? null : t.id)}
                      className="rounded-md bg-ink px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      {open ? "Close" : "Discuss"}
                    </button>
                    <button
                      onClick={async () => {
                        await deleteTracker(t.id);
                        load();
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {embedId === t.id && (
                  <div className="mt-3">
                    <iframe
                      src={t.url}
                      className="h-[480px] w-full rounded-md border border-slate-200"
                      title={t.title}
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      If it shows blank, the source blocks embedding — use the
                      link above to open it in a new tab.
                    </p>
                  </div>
                )}

                {open && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <IntelligencePanel
                      entityType="tracker"
                      entityId={t.id}
                      entityTitle={t.title}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
