import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { generate } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OWNER = "Ameet Zaveri (GSL Innovation Factory)";

/**
 * POST /api/delegate { entityType: "email"|"task", entityId, toName? }
 * Drafts a short, clear delegation note to hand off via Microsoft Teams.
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
  const { data: entity, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", entityId)
    .single();
  if (error || !entity) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const subject = entity.subject ?? entity.title ?? "this item";
  const detail = entity.summary ?? entity.note ?? "";

  const systemPrompt = `You write crisp delegation notes for ${OWNER} to send a colleague over Microsoft Teams. Keep it to 2-4 sentences: what you're handing over, what you need them to do, and the desired outcome / by-when if implied. Friendly, direct, first person as ${OWNER}. Plain text only.`;
  const userPrompt = `Delegate this${body.toName ? ` to ${body.toName}` : ""}:\n\nTitle: ${subject}\nDetails: ${detail}`;

  let note = "";
  try {
    note = await generate({ system: systemPrompt, user: userPrompt, maxTokens: 500 });
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
