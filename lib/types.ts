// Shared TypeScript types — mirror the Supabase schema in 001_init.sql exactly.

export type Priority = "urgent" | "high" | "medium" | "low";
export type TaskStatus = "active" | "done";
export type EmailStatus = "pending" | "replied" | "dismissed";

/** A quick-action button attached to a task or email. */
export interface TaskAction {
  label: string;
  prompt: string;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  status: TaskStatus;
  note: string | null;
  actions: TaskAction[];
  added_date: string; // ISO date (YYYY-MM-DD)
  done_date: string | null;
  created_at: string; // ISO timestamp
}

export interface Email {
  id: string;
  subject: string;
  from_name: string;
  from_email: string | null;
  received_date: string; // ISO date
  tag: string; // action | fyi | waiting | ...
  summary: string | null;
  draft: string | null;
  actions: TaskAction[];
  status: EmailStatus;
  resolved_date: string | null;
  m365_message_id: string | null;
  created_at: string;
}

export interface HistoryEvent {
  id: number;
  event_type: string;
  entity_id: string | null;
  entity_title: string | null;
  event_date: string; // ISO date
  metadata: Record<string, unknown>;
  created_at: string;
}

/** A piece of the "clone database" the AI uses to draft replies. */
export type KnowledgeKind = "fact" | "style" | "faq" | "person" | "policy";

export interface Knowledge {
  id: string;
  kind: KnowledgeKind;
  title: string;
  content: string;
  created_at: string;
}

/** Shape returned by /api/refresh. */
export interface RefreshResult {
  tasksAdded: number;
  emailsAdded: number;
  timestamp: string;
}
