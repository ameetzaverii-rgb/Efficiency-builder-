"use client";

// Client-side data layer.
//
// The app works in two modes, decided automatically:
//   • "online"  — a Supabase backend is configured, so we use the /api routes.
//   • "local"   — no backend yet, so everything is saved in this browser
//                 (localStorage). Zero setup required.
//
// Components never need to know which mode is active — they just call these
// functions.

import type {
  Email,
  EmailStatus,
  HistoryEvent,
  Knowledge,
  KnowledgeKind,
  Priority,
  Task,
  TaskStatus,
} from "./types";

const TASKS_KEY = "gsl_tasks";
const EMAILS_KEY = "gsl_emails";
const HISTORY_KEY = "gsl_history";

let backend: boolean | null = null;

/** Probe once whether the API/database is reachable. */
async function hasBackend(): Promise<boolean> {
  if (backend !== null) return backend;
  try {
    const r = await fetch("/api/tasks");
    backend = r.ok;
  } catch {
    backend = false;
  }
  return backend;
}

export async function isOnline(): Promise<boolean> {
  return hasBackend();
}

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore quota errors */
  }
}

function logLocal(
  event_type: string,
  entity_id: string | null,
  entity_title: string | null
): void {
  const history = read<HistoryEvent[]>(HISTORY_KEY, []);
  history.unshift({
    id: Date.now(),
    event_type,
    entity_id,
    entity_title,
    event_date: today(),
    metadata: {},
    created_at: now(),
  });
  write(HISTORY_KEY, history.slice(0, 500));
}

// ---- Seed data so a brand-new browser isn't empty -------------------------

function seedIfEmpty(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(TASKS_KEY)) return;

  const seedTasks: Task[] = [
    {
      id: `task_${uid()}`,
      title: '👋 Welcome! This is your task list. Click "Done" when finished.',
      project: "GSL Innovation",
      priority: "high",
      status: "active",
      note: "Add your own with the box above. Everything saves automatically.",
      actions: [],
      added_date: today(),
      done_date: null,
      created_at: now(),
    },
    {
      id: `task_${uid()}`,
      title: "Try adding a task of your own",
      project: "GSL Innovation",
      priority: "medium",
      status: "active",
      note: null,
      actions: [],
      added_date: today(),
      done_date: null,
      created_at: now(),
    },
  ];

  const seedEmails: Email[] = [
    {
      id: `email_${uid()}`,
      subject: "Example flagged email — click to expand",
      from_name: "GSL Command Center",
      from_email: null,
      received_date: today(),
      tag: "action",
      summary:
        "Real flagged emails from Outlook show up here once Microsoft 365 is connected. For now this is just an example.",
      draft: null,
      actions: [],
      status: "pending",
      resolved_date: null,
      m365_message_id: null,
      created_at: now(),
    },
  ];

  write(TASKS_KEY, seedTasks);
  write(EMAILS_KEY, seedEmails);
  write(HISTORY_KEY, []);
}

// ---- Tasks ----------------------------------------------------------------

export async function getTasks(): Promise<Task[]> {
  if (await hasBackend()) {
    const r = await fetch("/api/tasks");
    return r.ok ? r.json() : [];
  }
  seedIfEmpty();
  return read<Task[]>(TASKS_KEY, []).filter((t) => t.status === "active");
}

export async function addTask(input: {
  title: string;
  priority: Priority;
}): Promise<void> {
  if (await hasBackend()) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return;
  }
  const tasks = read<Task[]>(TASKS_KEY, []);
  const task: Task = {
    id: `task_${uid()}`,
    title: input.title,
    project: "GSL Innovation",
    priority: input.priority,
    status: "active",
    note: null,
    actions: [],
    added_date: today(),
    done_date: null,
    created_at: now(),
  };
  tasks.unshift(task);
  write(TASKS_KEY, tasks);
  logLocal("task_added", task.id, task.title);
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus
): Promise<void> {
  if (await hasBackend()) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return;
  }
  const tasks = read<Task[]>(TASKS_KEY, []);
  const t = tasks.find((x) => x.id === id);
  if (t) {
    t.status = status;
    t.done_date = status === "done" ? today() : null;
    write(TASKS_KEY, tasks);
    if (status === "done") logLocal("task_completed", t.id, t.title);
  }
}

export async function deleteTask(id: string): Promise<void> {
  if (await hasBackend()) {
    await fetch(`/api/tasks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return;
  }
  const tasks = read<Task[]>(TASKS_KEY, []);
  const t = tasks.find((x) => x.id === id);
  write(
    TASKS_KEY,
    tasks.filter((x) => x.id !== id)
  );
  logLocal("task_deleted", id, t?.title ?? null);
}

// ---- Emails ---------------------------------------------------------------

export async function getEmails(): Promise<Email[]> {
  if (await hasBackend()) {
    const r = await fetch("/api/emails");
    return r.ok ? r.json() : [];
  }
  seedIfEmpty();
  return read<Email[]>(EMAILS_KEY, []).filter((e) => e.status === "pending");
}

/** Replied or dismissed emails — so you can review the AI drafts you generated. */
export async function getHandledEmails(): Promise<Email[]> {
  if (await hasBackend()) {
    const r = await fetch("/api/emails?status=handled");
    return r.ok ? r.json() : [];
  }
  return read<Email[]>(EMAILS_KEY, []).filter((e) => e.status !== "pending");
}

export async function setEmailStatus(
  id: string,
  status: EmailStatus
): Promise<void> {
  if (await hasBackend()) {
    await fetch("/api/emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    return;
  }
  const emails = read<Email[]>(EMAILS_KEY, []);
  const e = emails.find((x) => x.id === id);
  if (e) {
    e.status = status;
    e.resolved_date = today();
    write(EMAILS_KEY, emails);
    logLocal(`email_${status}`, e.id, e.subject);
  }
}

// ---- History --------------------------------------------------------------

export async function getHistory(): Promise<HistoryEvent[]> {
  if (await hasBackend()) {
    const r = await fetch("/api/history");
    return r.ok ? r.json() : [];
  }
  return read<HistoryEvent[]>(HISTORY_KEY, []);
}

// ---- AI reply drafting ----------------------------------------------------

/** Ask the AI to draft a reply to an email. Online mode only. */
export async function draftReply(
  emailId: string,
  instruction?: string
): Promise<string> {
  if (!(await hasBackend())) {
    throw new Error(
      "Drafting needs the live database + Anthropic key (connect Supabase & ANTHROPIC_API_KEY in Vercel)."
    );
  }
  const r = await fetch("/api/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailId, instruction }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Draft failed");
  return data.draft as string;
}

/** Log a decision (Delegate / Defer / etc.) to the timeline. */
export async function logDecision(input: {
  entityId?: string;
  entityTitle?: string;
  decision: string;
  reason?: string;
}): Promise<void> {
  if (!(await hasBackend())) {
    logLocal(`decision_${input.decision}`, input.entityId ?? null, input.entityTitle ?? null);
    return;
  }
  await fetch("/api/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// ---- Knowledge base -------------------------------------------------------

export async function getKnowledge(): Promise<Knowledge[]> {
  if (await hasBackend()) {
    const r = await fetch("/api/knowledge");
    return r.ok ? r.json() : [];
  }
  return [];
}

export async function addKnowledge(input: {
  kind: KnowledgeKind;
  title: string;
  content: string;
}): Promise<void> {
  if (!(await hasBackend())) {
    throw new Error("Knowledge base needs the live database.");
  }
  await fetch("/api/knowledge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteKnowledge(id: string): Promise<void> {
  if (!(await hasBackend())) return;
  await fetch(`/api/knowledge?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
