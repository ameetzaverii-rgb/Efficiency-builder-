"use client";

import { useCallback, useEffect, useState } from "react";
import type { Email, HistoryEvent, RefreshResult, Task } from "@/lib/types";
import TodayTab from "./TodayTab";
import TasksTab from "./TasksTab";
import EmailsTab from "./EmailsTab";
import HistoryTab from "./HistoryTab";
import SetupTab from "./SetupTab";

type TabKey = "today" | "tasks" | "emails" | "history" | "setup";

const TABS: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tasks", label: "Tasks" },
  { key: "emails", label: "Emails" },
  { key: "history", label: "History" },
  { key: "setup", label: "Setup" },
];

export default function CommandCenter() {
  const [tab, setTab] = useState<TabKey>("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, e, h] = await Promise.all([
        fetch("/api/tasks").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/emails").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/history").then((r) => (r.ok ? r.json() : [])),
      ]);
      setTasks(Array.isArray(t) ? t : []);
      setEmails(Array.isArray(e) ? e : []);
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      setBanner("Could not reach the API. Check your Supabase env vars.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setBanner(null);
    try {
      const res = await fetch("/api/refresh");
      if (res.ok) {
        const data: RefreshResult = await res.json();
        setBanner(
          `Synced · ${data.tasksAdded} tasks · ${data.emailsAdded} emails`
        );
        await loadAll();
      } else {
        const err = await res.json().catch(() => ({}));
        setBanner(`Refresh failed: ${err.error ?? res.status}`);
      }
    } catch {
      setBanner("Refresh request failed.");
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">GSL Command Center</h1>
            <p className="text-sm text-slate-500">GSL Innovation Factory</p>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
                tab === t.key
                  ? "border-ink text-ink"
                  : "border-transparent text-slate-500 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {banner && (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">
            {banner}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            {tab === "today" && (
              <TodayTab tasks={tasks} emails={emails} onChanged={loadAll} />
            )}
            {tab === "tasks" && (
              <TasksTab tasks={tasks} onChanged={loadAll} />
            )}
            {tab === "emails" && (
              <EmailsTab emails={emails} onChanged={loadAll} />
            )}
            {tab === "history" && <HistoryTab history={history} />}
            {tab === "setup" && <SetupTab />}
          </>
        )}
      </div>
    </main>
  );
}
