import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/emails — pending emails, newest received first. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .eq("status", "pending")
    .order("received_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/emails — create / upsert an email. */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);

  if (!body?.subject || !body?.from_name || !body?.received_date) {
    return NextResponse.json(
      { error: "subject, from_name and received_date are required" },
      { status: 400 }
    );
  }

  const id: string = body.id ?? `email_${crypto.randomUUID()}`;
  const row = {
    id,
    subject: body.subject,
    from_name: body.from_name,
    from_email: body.from_email ?? null,
    received_date: body.received_date,
    tag: body.tag ?? "action",
    summary: body.summary ?? null,
    draft: body.draft ?? null,
    actions: body.actions ?? [],
    status: "pending",
    m365_message_id: body.m365_message_id ?? null,
  };

  const { data, error } = await supabase
    .from("emails")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/emails — update status (replied | dismissed) or fields. */
export async function PATCH(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);

  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const field of ["status", "tag", "summary", "draft", "actions"]) {
    if (field in body) updates[field] = body[field];
  }
  if (body.status === "replied" || body.status === "dismissed") {
    updates.resolved_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("emails")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status === "replied" || body.status === "dismissed") {
    await supabase.from("history").insert({
      event_type: `email_${body.status}`,
      entity_id: body.id,
      entity_title: data?.subject,
    });
  }

  return NextResponse.json(data, { status: 200 });
}
