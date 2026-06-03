"use client";

import { useCallback, useEffect, useState } from "react";
import type { Knowledge, KnowledgeKind } from "@/lib/types";
import { addKnowledge, deleteKnowledge, getKnowledge } from "@/lib/store";

const KINDS: { value: KnowledgeKind; label: string; hint: string }[] = [
  { value: "fact", label: "Fact", hint: "Company info, products, numbers" },
  { value: "style", label: "Writing style", hint: "Paste a few of your real replies" },
  { value: "faq", label: "FAQ", hint: "A common question + your answer" },
  { value: "person", label: "Person", hint: "Who someone is / how to handle them" },
  { value: "policy", label: "Policy", hint: "Pricing, approvals, do's & don'ts" },
];

export default function KnowledgeTab() {
  const [items, setItems] = useState<Knowledge[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<KnowledgeKind>("fact");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await getKnowledge());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addKnowledge({ kind, title: title.trim(), content: content.trim() });
      setTitle("");
      setContent("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await deleteKnowledge(id);
    await load();
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        This is your <strong>clone database</strong> — what the AI uses to draft
        replies in your voice. The more you add (facts, pricing, your writing
        style, how to handle key people), the better the drafts.
      </p>

      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as KnowledgeKind)}
            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Short title (e.g. 'Robotics course pricing')"
            className="min-w-[220px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </div>
        <p className="text-xs text-slate-400">
          {KINDS.find((k) => k.value === kind)?.hint}
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="The details the AI should know…"
          className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-ink"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={add}
            disabled={busy}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            + Add to knowledge
          </button>
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nothing yet. Add your first entry above — even 3–4 entries noticeably
          improve the AI&apos;s replies.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((k) => (
            <li
              key={k.id}
              className="flex items-start justify-between rounded-lg border border-slate-200 bg-white p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {k.kind}
                  </span>
                  <p className="font-medium">{k.title}</p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                  {k.content}
                </p>
              </div>
              <button
                onClick={() => remove(k.id)}
                className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
