"use client";

import { useCallback, useEffect, useState } from "react";
import type { Insight, Viewpoint } from "@/lib/types";
import {
  addViewpoint,
  analyzeItem,
  deleteViewpoint,
  getInsight,
  getViewpoints,
} from "@/lib/store";

const CONF_BADGE: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

export default function IntelligencePanel({
  entityType,
  entityId,
}: {
  entityType: "email" | "task" | "deal";
  entityId: string;
}) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [viewpoints, setViewpoints] = useState<Viewpoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  const loadStored = useCallback(async () => {
    const [row, vps] = await Promise.all([
      getInsight(entityId),
      getViewpoints(entityId),
    ]);
    if (row) {
      setInsight(row.data);
      setUpdatedAt(row.updated_at);
    }
    setViewpoints(vps);
  }, [entityId]);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  const analyze = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await analyzeItem(entityType, entityId);
      setInsight(result);
      setUpdatedAt(new Date().toISOString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  };

  const submitViewpoint = async () => {
    if (!content.trim()) return;
    await addViewpoint({
      entityId,
      entityType,
      author: author.trim() || undefined,
      content: content.trim(),
    });
    setContent("");
    setViewpoints(await getViewpoints(entityId));
  };

  const removeViewpoint = async (id: string) => {
    await deleteViewpoint(id);
    setViewpoints(await getViewpoints(entityId));
  };

  return (
    <div className="space-y-3 rounded-md border border-indigo-100 bg-indigo-50/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={analyze}
          disabled={busy}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy
            ? "Analyzing…"
            : insight
            ? "↻ Re-analyze (with viewpoints)"
            : "🔎 Analyze this decision"}
        </button>
        {updatedAt && (
          <span className="text-xs text-slate-400">
            updated {new Date(updatedAt).toLocaleString()}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {insight && (
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Decision required
            </p>
            <p className="text-slate-800">{insight.decision_required}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
              Context
            </p>
            <p className="text-slate-700">{insight.context}</p>
          </div>
          {insight.considerations?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Viewpoints &amp; angles
              </p>
              <ul className="mt-1 space-y-1">
                {insight.considerations.map((c, i) => (
                  <li key={i} className="text-slate-700">
                    <span className="font-medium">{c.angle}:</span> {c.point}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insight.risks?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Risks
              </p>
              <ul className="mt-1 list-disc pl-5 text-slate-700">
                {insight.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-md bg-white p-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Recommendation
              </p>
              {insight.confidence && (
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${CONF_BADGE[insight.confidence] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {insight.confidence} confidence
                </span>
              )}
            </div>
            <p className="mt-1 text-slate-800">{insight.recommendation}</p>
          </div>
          {insight.open_questions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Still need to know
              </p>
              <ul className="mt-1 list-disc pl-5 text-slate-700">
                {insight.open_questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Viewpoints accumulation */}
      <div className="border-t border-indigo-100 pt-2">
        <p className="text-xs font-semibold uppercase text-slate-400">
          Viewpoints log ({viewpoints.length})
        </p>
        {viewpoints.length > 0 && (
          <ul className="mt-1 space-y-1">
            {viewpoints.map((v) => (
              <li
                key={v.id}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <span className="text-slate-700">
                  {v.author && (
                    <span className="font-medium">{v.author}: </span>
                  )}
                  {v.content}
                </span>
                <button
                  onClick={() => removeViewpoint(v.id)}
                  className="shrink-0 text-xs text-slate-400 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="who (optional)"
            className="w-28 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-ink"
          />
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitViewpoint()}
            placeholder="add a viewpoint / input on this decision…"
            className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-ink"
          />
          <button
            onClick={submitViewpoint}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-white"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
