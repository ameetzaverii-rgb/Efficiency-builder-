"use client";

import { useCallback, useEffect, useState } from "react";
import { addTask, getJira, type JiraIssue } from "@/lib/store";

const STATUS_COLOR: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  indeterminate: "bg-amber-100 text-amber-700",
  new: "bg-slate-100 text-slate-600",
};

export default function JiraTab() {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jql, setJql] = useState("");

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getJira(q);
      setConfigured(res.configured);
      setIssues(res.issues ?? []);
      if (res.error) setError(res.error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const makeTask = async (i: JiraIssue) => {
    await addTask({
      title: `${i.key}: ${i.summary}`,
      priority: i.priority?.toLowerCase().includes("high") ? "high" : "medium",
    });
  };

  if (loading && configured === null) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  if (configured === false) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Jira isn&apos;t connected yet.</p>
          <p className="mt-1">
            Add these in Vercel → Settings → Environment Variables, then
            redeploy:
          </p>
          <ul className="mt-2 list-disc pl-5">
            <li>
              <code>JIRA_BASE_URL</code> — e.g.{" "}
              <code>https://getsetlearn.atlassian.net</code>
            </li>
            <li>
              <code>JIRA_EMAIL</code> — your Atlassian login email
            </li>
            <li>
              <code>JIRA_API_TOKEN</code> — create at{" "}
              <a
                className="underline"
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noreferrer"
              >
                id.atlassian.com → API tokens
              </a>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={jql}
          onChange={(e) => setJql(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(jql || undefined)}
          placeholder="JQL filter (blank = my open issues)"
          className="min-w-[240px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={() => load(jql || undefined)}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {issues.length === 0 ? (
        <p className="text-sm text-slate-500">No issues for this filter.</p>
      ) : (
        <ul className="space-y-2">
          {issues.map((i) => (
            <li
              key={i.key}
              className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={i.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    {i.key}
                  </a>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      STATUS_COLOR[i.statusCategory] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {i.status}
                  </span>
                  {i.priority && (
                    <span className="text-[10px] text-slate-400">
                      {i.priority}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-medium">{i.summary}</p>
                <p className="text-xs text-slate-500">
                  {i.project ? `${i.project} · ` : ""}
                  {i.type ?? ""}
                  {i.assignee ? ` · ${i.assignee}` : ""}
                  {i.duedate ? ` · due ${i.duedate}` : ""}
                </p>
              </div>
              <button
                onClick={() => makeTask(i)}
                className="shrink-0 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
              >
                + Task
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
