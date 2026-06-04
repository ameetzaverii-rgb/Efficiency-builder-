import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { generate, parseJSON } from "@/lib/ai";
import type { Insight, Knowledge, Viewpoint } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OWNER = "Ameet Zaveri (GSL Innovation Factory)";

const INSIGHT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    decision_required: {
      type: "string",
      description: "One sentence: the specific decision being asked of the owner.",
    },
    context: {
      type: "string",
      description: "A SHORT context window — max 2 sentences of the most relevant background.",
    },
    decision_options: {
      type: "array",
      description:
        "When a decision is genuinely needed, present 2-4 concrete choices in multiple-choice form. If no real decision is required, return an empty array.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          option: { type: "string", description: "A specific, actionable choice." },
          implication: { type: "string", description: "One line: what this choice means / its trade-off." },
          recommended: { type: "boolean" },
        },
        required: ["option", "implication", "recommended"],
      },
    },
    considerations: {
      type: "array",
      description: "Distinct angles/viewpoints on the decision.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          angle: { type: "string", description: "e.g. Commercial, Operational, Relationship, Risk, Strategic" },
          point: { type: "string" },
        },
        required: ["angle", "point"],
      },
    },
    risks: { type: "array", items: { type: "string" } },
    recommendation: {
      type: "string",
      description: "A clear recommended course of action, in the owner's interest.",
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    open_questions: {
      type: "array",
      description: "What information or viewpoints are still needed before deciding well.",
      items: { type: "string" },
    },
  },
  required: [
    "decision_required",
    "context",
    "decision_options",
    "considerations",
    "risks",
    "recommendation",
    "confidence",
    "open_questions",
  ],
};

function knowledgeText(rows: Knowledge[]): string {
  if (!rows.length) return "(no knowledge base entries yet)";
  return rows.map((r) => `- [${r.kind}] ${r.title}: ${r.content}`).join("\n");
}

/**
 * POST /api/analyze { entityType: "email"|"task"|"deal", entityId }
 * Produces structured decision intelligence, incorporating any accumulated
 * viewpoints, and stores it as the latest insight for the item.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const entityType: string = body?.entityType ?? "email";
  const entityId: string | undefined = body?.entityId;
  if (!entityId) {
    return NextResponse.json({ error: "entityId is required" }, { status: 400 });
  }

  const supabase = getServerClient();

  const table =
    entityType === "task"
      ? "tasks"
      : entityType === "deal"
      ? "deals"
      : entityType === "tracker"
      ? "trackers"
      : "emails";
  const { data: entity, error: entErr } = await supabase
    .from(table)
    .select("*")
    .eq("id", entityId)
    .single();
  if (entErr || !entity) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { data: kRows } = await supabase
    .from("knowledge")
    .select("*")
    .order("created_at", { ascending: false });
  const knowledge = (kRows as Knowledge[]) ?? [];

  const { data: vRows } = await supabase
    .from("viewpoints")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  const viewpoints = (vRows as Viewpoint[]) ?? [];

  const itemDescription =
    entityType === "email"
      ? `EMAIL\nFrom: ${entity.from_name}${entity.from_email ? ` <${entity.from_email}>` : ""}\nSubject: ${entity.subject}\nReceived: ${entity.received_date}\nContent: ${entity.summary ?? "(none)"}`
      : entityType === "task"
      ? `TASK\nTitle: ${entity.title}\nProject: ${entity.project}\nPriority: ${entity.priority}\nNote: ${entity.note ?? "(none)"}`
      : entityType === "tracker"
      ? `CLIENT TRACKER\nTitle: ${entity.title}\nLink: ${entity.url}\nNote: ${entity.note ?? "(none)"}\nThe discussion below contains related emails/notes about these clients.`
      : `DEAL\nName: ${entity.name}\nPartner: ${entity.partner ?? "?"}\nStage: ${entity.stage}\nValue: ${entity.value ?? "?"}\nNext step: ${entity.next_step ?? "?"}\nNote: ${entity.note ?? "(none)"}`;

  const viewpointsText = viewpoints.length
    ? viewpoints
        .map((v) => `- ${v.author ? v.author + ": " : ""}${v.content}`)
        .join("\n")
    : "(no viewpoints recorded yet)";

  const systemPrompt = `You are the chief-of-staff and decision analyst for ${OWNER}. For each item, produce sharp, honest decision intelligence to help ${OWNER} decide fast and well. Be specific to GSL's education/future-skills business; avoid generic advice. Weigh every recorded viewpoint. If key information is missing, say what's needed rather than guessing.

CRITICAL: Keep "context" to at most 2 sentences. When a decision is genuinely required, present it as 2-4 concrete multiple-choice "decision_options", each with its implication, and mark exactly one as recommended. If the item needs no real decision (pure FYI), return an empty decision_options array.

# KNOWLEDGE BASE
${knowledgeText(knowledge)}`;

  const userPrompt = `Analyze this item and return the decision intelligence.

${itemDescription}

# VIEWPOINTS RECORDED SO FAR (weigh these)
${viewpointsText}`;

  let insight: Insight;
  try {
    const text = await generate({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 2000,
      jsonSchema: INSIGHT_SCHEMA,
    });
    insight = parseJSON<Insight>(text);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }

  const now = new Date().toISOString();
  await supabase.from("insights").upsert(
    {
      entity_id: entityId,
      entity_type: entityType,
      data: insight,
      updated_at: now,
    },
    { onConflict: "entity_id" }
  );
  await supabase.from("history").insert({
    event_type: "analyzed",
    entity_id: entityId,
    entity_title:
      entity.subject ?? entity.title ?? entity.name ?? "item",
  });

  return NextResponse.json({ insight }, { status: 200 });
}

/** GET /api/analyze?entityId=... — fetch the stored insight, if any. */
export async function GET(req: NextRequest) {
  const supabase = getServerClient();
  const entityId = req.nextUrl.searchParams.get("entityId");
  if (!entityId) {
    return NextResponse.json({ error: "entityId required" }, { status: 400 });
  }
  const { data } = await supabase
    .from("insights")
    .select("*")
    .eq("entity_id", entityId)
    .maybeSingle();
  return NextResponse.json(data ?? null, { status: 200 });
}
