import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { generate } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OWNER = "Ameet Zaveri (GSL Innovation Factory)";

/**
 * GET /api/brief — an AI-written morning brief from the live command-center data:
 * pending emails, active tasks, the pipeline, and recent decisions.
 */
export async function GET() {
  const supabase = getServerClient();

  const [emailsRes, tasksRes, dealsRes, historyRes] = await Promise.all([
    supabase.from("emails").select("subject,from_name,tag,received_date").eq("status", "pending").order("received_date", { ascending: false }).limit(40),
    supabase.from("tasks").select("title,project,priority").eq("status", "active").order("created_at", { ascending: false }).limit(40),
    supabase.from("deals").select("name,partner,stage,next_step").order("created_at", { ascending: false }).limit(40),
    supabase.from("history").select("event_type,entity_title,created_at").order("created_at", { ascending: false }).limit(40),
  ]);

  const emails = emailsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const deals = dealsRes.data ?? [];
  const history = historyRes.data ?? [];

  const data = `# PENDING EMAILS (${emails.length})
${emails.map((e) => `- [${e.tag}] ${e.subject} — ${e.from_name} (${e.received_date})`).join("\n") || "(none)"}

# ACTIVE TASKS (${tasks.length})
${tasks.map((t) => `- [${t.priority}] ${t.title} (${t.project})`).join("\n") || "(none)"}

# PIPELINE (${deals.length})
${deals.map((d) => `- ${d.name} / ${d.partner ?? "?"} — ${d.stage}${d.next_step ? ` → next: ${d.next_step}` : ""}`).join("\n") || "(none)"}

# RECENT ACTIVITY
${history.slice(0, 15).map((h) => `- ${h.event_type}: ${h.entity_title ?? ""}`).join("\n") || "(none)"}`;

  const systemPrompt = `You are chief of staff to ${OWNER}. Write a crisp morning brief he can read in 60 seconds. Be specific and prioritized — surface what truly needs HIM today, what's moving, and what may be slipping. Use short sections with these headers exactly: "Decisions needing you", "Pipeline & partnerships", "Likely slipping / follow up", "Suggested focus (top 3)". Use tight bullets, no preamble, no sign-off.`;

  let brief = "";
  try {
    brief = await generate({
      system: systemPrompt,
      user: `Today's data:\n\n${data}`,
      maxTokens: 1500,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Brief failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ brief, generatedAt: new Date().toISOString() }, { status: 200 });
}
