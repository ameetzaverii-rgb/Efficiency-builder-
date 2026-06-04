"use client";

import { useCallback, useEffect, useState } from "react";
import type { Email, HistoryEvent, Task } from "@/lib/types";
import { getAiStatus, getEmails, getHistory, getTasks, isOnline } from "@/lib/store";
import TodayTab from "./TodayTab";
import DecisionQueueTab from "./DecisionQueueTab";
import TasksTab from "./TasksTab";
import EmailsTab from "./EmailsTab";
import PipelineTab from "./PipelineTab";
import TrackersTab from "./TrackersTab";
import HistoryTab from "./HistoryTab";
import KnowledgeTab from "./KnowledgeTab";
import SetupTab from "./SetupTab";

type TabKey =
  | "today"
  | "decisions"
  | "tasks"
  | "emails"
  | "pipeline"
  | "trackers"
  | "knowledge"
  | "history"
  | "setup";

const TABS: { key: TabKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "decisions", label: "Decisions" },
  { key: "tasks", label: "Tasks" },
  { key: "emails", label: "Emails" },
  { key: "pipeline", label: "Pipeline" },
  { key: "trackers", label: "Trackers" },
  { key: "knowledge", label: "Knowledge" },
  { key: "history", label: "History" },
  { key: "setup", label: "Setup" },
];

const AI_LABEL: Record<string, { text: string; cls: string }> = {
  gemini: { text: "AI: Gemini ✓", cls: "bg-green-100 text-green-700" },
  anthropic: { text: "AI: Claude ✓", cls: "bg-green-100 text-green-700" },
  none: { text: "AI: not connected", cls: "bg-amber-100 text-amber-700" },
};

export default function CommandCenter() {
  const [tab, setTab] = useState<TabKey>("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<boolean | null>(null);
  const [ai, setAi] = useState<string>("none");

  useEffect(() => {
    getAiStatus().then(setAi);
  }, []);

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
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                online ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {online ? "Database ✓" : "Local mode"}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${(AI_LABEL[ai] ?? AI_LABEL.none).cls}`}
            >
              {(AI_LABEL[ai] ?? AI_LABEL.none).text}
            </span>
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
            {tab === "decisions" && (
              <DecisionQueueTab
                tasks={tasks}
                emails={emails}
                onChanged={loadAll}
              />
            )}
            {tab === "tasks" && <TasksTab tasks={tasks} onChanged={loadAll} />}
            {tab === "emails" && (
              <EmailsTab emails={emails} onChanged={loadAll} />
            )}
            {tab === "pipeline" && <PipelineTab />}
            {tab === "trackers" && <TrackersTab />}
            {tab === "knowledge" && <KnowledgeTab />}
            {tab === "history" && <HistoryTab history={history} />}
            {tab === "setup" && <SetupTab online={online} />}
          </>
        )}
      </div>
    </main>
  );
}
