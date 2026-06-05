import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { generate } from "@/lib/ai";
import type { Insight, Viewpoint } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OWNER = "Ameet Zaveri (GSL Innovation Factory)";

/**
 * POST /api/delegate { entityType: "email"|"task", entityId, toName?, context? }
 * Drafts a SELF-CONTAINED delegation brief to hand off via Microsoft Teams —
 * pulling in the item details, any AI analysis/recommendation, and viewpoints,
 * so the recipient has full context to act without a follow-up.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const entityType: string = body?.entityType ?? "task";
  const entityId: string | undefined = body?.entityId;
  if (!entityId) {
    return NextResponse.json({ error: "entityId required" }, { status: 400 });
  }

  const supabase = getServerClient();
  const table = entityType === "email" ? "emails" : "tasks";

  const [entityRes, insightRes, vpRes] = await Promise.all([
    supabase.from(table).select("*").eq("id", entityId).single(),
    supabase.from("insights").select("data").eq("entity_id", entityId).maybeSingle(),
    supabase.from("viewpoints").select("*").eq("entity_id", entityId).order("created_at", { ascending: true }),
  ]);

  const entity = entityRes.data;
  if (entityRes.error || !entity) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const subject = entity.subject ?? entity.title ?? "this item";
  const detail = entity.summary ?? entity.note ?? "";
  const from = entity.from_name ? `From: ${entity.from_name}\n` : "";
  const project = entity.project ? `Project: ${entity.project}\n` : "";

  const insight = insightRes.data?.data as Insight | undefined;
  const insightText = insight
    ? `\n# WHAT WE KNOW / DECIDED\nContext: ${insight.context}\nRecommendation: ${insight.recommendation}${
        insight.open_questions?.length
          ? `\nOpen questions: ${insight.open_questions.join("; ")}`
          : ""
      }`
    : "";

  const viewpoints = (vpRes.data as Viewpoint[]) ?? [];
  const vpText = viewpoints.length
    ? `\n# VIEWPOINTS ON RECORD\n${viewpoints
        .map((v) => `- ${v.author ? v.author + ": " : ""}${v.content}`)
        .join("\n")}`
    : "";

  const ownerInstruction = body.context
    ? `\n# ${OWNER}'S INSTRUCTION FOR THE HANDOFF\n${body.context}`
    : "";

  const systemPrompt = `You write delegation briefs that ${OWNER} sends a colleague over Microsoft Teams to hand off work. The recipient must be able to ACT without coming back with questions, so include the necessary context — but stay tight.

Structure the message as:
1. A one-line framing of what you're handing over and why.
2. "Context:" 1-3 short lines of the relevant background (pull from the details, analysis, and viewpoints provided).
3. "What I need from you:" the specific ask — concrete and actionable.
4. "By:" a sensible timeframe if one is implied, else omit.

First person as ${OWNER}, warm and direct. Plain text (no markdown headers, no preamble like "Here's the note"). If a critical detail is missing, add a clearly bracketed [placeholder] rather than inventing it.`;

  const userPrompt = `Write the delegation brief${body.toName ? ` for ${body.toName}` : ""}.

# ITEM (${entityType})
${from}${project}Title: ${subject}
Details: ${detail || "(none provided)"}${insightText}${vpText}${ownerInstruction}`;

  let note = "";
  try {
    note = await generate({ system: systemPrompt, user: userPrompt, maxTokens: 700 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Draft failed" },
      { status: 500 }
    );
  }

  await supabase.from("history").insert({
    event_type: "decision_delegate",
    entity_id: entityId,
    entity_title: subject,
    metadata: body.toName ? { to: body.toName } : {},
  });

  return NextResponse.json({ note }, { status: 200 });
}
