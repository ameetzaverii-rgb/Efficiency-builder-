import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Power Automate push endpoint.
 * POST { type: "task" | "email", data: {...} }
 * Protected with the WEBHOOK_SECRET header (`x-webhook-secret` or
 * `Authorization: Bearer <WEBHOOK_SECRET>`).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.WEBHOOK_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerSecret = req.headers.get("x-webhook-secret");
    const ok = auth === `Bearer ${expected}` || headerSecret === expected;
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json().catch(() => null);
  if (!body?.type || !body?.data) {
    return NextResponse.json(
      { error: "Expected { type, data }" },
      { status: 400 }
    );
  }

  const supabase = getServerClient();

  if (body.type === "task") {
    const d = body.data;
    if (!d.title) {
      return NextResponse.json({ error: "task.title required" }, { status: 400 });
    }
    const row = {
      id: d.id ?? `task_${crypto.randomUUID()}`,
      title: d.title,
      project: d.project ?? "GSL Innovation",
      priority: d.priority ?? "high",
      status: "active",
      note: d.note ?? null,
      actions: d.actions ?? [],
    };
    const { data, error } = await supabase
      .from("tasks")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  if (body.type === "email") {
    const d = body.data;
    if (!d.subject || !d.from_name || !d.received_date) {
      return NextResponse.json(
        { error: "email.subject, from_name, received_date required" },
        { status: 400 }
      );
    }
    const row = {
      id: d.id ?? `email_${crypto.randomUUID()}`,
      subject: d.subject,
      from_name: d.from_name,
      from_email: d.from_email ?? null,
      received_date: d.received_date,
      tag: d.tag ?? "action",
      summary: d.summary ?? null,
      draft: d.draft ?? null,
      actions: d.actions ?? [],
      status: "pending",
      m365_message_id: d.m365_message_id ?? null,
    };
    const { data, error } = await supabase
      .from("emails")
      .upsert(row, { onConflict: "m365_message_id" })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json(
    { error: `Unknown type: ${body.type}` },
    { status: 400 }
  );
}
