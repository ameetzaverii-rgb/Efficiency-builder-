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

/** Partnership pipeline. */
export type DealStage = "exploring" | "negotiating" | "live" | "paused";

export interface Deal {
  id: string;
  name: string;
  partner: string | null;
  stage: DealStage;
  value: string | null;
  note: string | null;
  next_step: string | null;
  last_touch: string | null;
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

/** External client/data trackers surfaced in the command center. */
export type TrackerType = "sharepoint" | "appsscript" | "sheet" | "link";

export interface Tracker {
  id: string;
  title: string;
  url: string;
  type: TrackerType;
  note: string | null;
  created_at: string;
}

/** A perspective/input on a decision, accumulated over time. */
export interface Viewpoint {
  id: string;
  entity_id: string;
  entity_type: string; // email | task | deal
  author: string | null;
  content: string;
  created_at: string;
}

/** AI-synthesized decision intelligence for an item. */
export interface Insight {
  decision_required: string;
  context: string;
  /** Concrete choices presented multiple-choice style (empty if no decision needed). */
  decision_options: { option: string; implication: string; recommended: boolean }[];
  considerations: { angle: string; point: string }[];
  risks: string[];
  recommendation: string;
  confidence: "low" | "medium" | "high";
  open_questions: string[];
}

/** A stored insight row (latest analysis for an entity). */
export interface InsightRow {
  entity_id: string;
  entity_type: string;
  data: Insight;
  updated_at: string;
}
