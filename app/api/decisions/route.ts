import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * POST /api/decisions
 * { entityId, entityTitle, decision, reason? }
 * Logs a decision to the history timeline. Used for Delegate / Defer / Note
 * actions that don't map cleanly onto an email/task status change.
 */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.decision) {
    return NextResponse.json({ error: "decision is required" }, { status: 400 });
  }
  const { error } = await supabase.from("history").insert({
    event_type: `decision_${body.decision}`,
    entity_id: body.entityId ?? null,
    entity_title: body.entityTitle ?? null,
    metadata: body.reason ? { reason: body.reason } : {},
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
