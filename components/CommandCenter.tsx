"use client";

import { useCallback, useEffect, useState } from "react";
import type { Email, HistoryEvent, Task } from "@/lib/types";
import { getEmails, getHistory, getTasks, isOnline } from "@/lib/store";
import TodayTab from "./TodayTab";
import TasksTab from "./TasksTab";
import EmailsTab from "./EmailsTab";
import HistoryTab from "./HistoryTab";
import KnowledgeTab from "./KnowledgeTab";
import SetupTab from "./SetupTab";

type TabKey = "today" | "tasks" | "emails" | "knowledge" | "history" | "setup";

const TABS: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "tasks", label: "Tasks" },
  { key: "emails", label: "Emails" },
  { key: "knowledge", label: "Knowledge" },
  { key: "history", label: "History" },
  { key: "setup", label: "Setup" },
];

export default function CommandCenter() {
  const [tab, setTab] = useState<TabKey>("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<boolean | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [t, e, h, o] = await Promise.all([
      getTasks(),
      getEmails(),
      getHistory(),
      isOnline(),
    ]);
    setTasks(t);
    setEmails(e);
    setHistory(h);
    setOnline(o);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold">GSL Command Center</h1>
            <p className="text-sm text-slate-500">GSL Innovation Factory</p>
          </div>
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

      <div className="mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            {tab === "today" && (
              <TodayTab tasks={tasks} emails={emails} onChanged={loadAll} />
            )}
            {tab === "tasks" && <TasksTab tasks={tasks} onChanged={loadAll} />}
            {tab === "emails" && (
              <EmailsTab emails={emails} onChanged={loadAll} />
            )}
            {tab === "knowledge" && <KnowledgeTab />}
            {tab === "history" && <HistoryTab history={history} />}
            {tab === "setup" && <SetupTab online={online} />}
          </>
        )}
      </div>
    </main>
  );
}
