import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/tasks — active tasks, newest first. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/tasks — create a task. */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);

  if (!body?.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const id: string = body.id ?? `task_${crypto.randomUUID()}`;
  const row = {
    id,
    title: body.title,
    project: body.project ?? "GSL Innovation",
    priority: body.priority ?? "high",
    status: "active",
    note: body.note ?? null,
    actions: body.actions ?? [],
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("history").insert({
    event_type: "task_added",
    entity_id: id,
    entity_title: body.title,
  });

  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/tasks — update a task (e.g. mark done). */
export async function PATCH(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);

  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const field of ["title", "project", "priority", "status", "note", "actions"]) {
    if (field in body) updates[field] = body[field];
  }
  if (body.status === "done") {
    updates.done_date = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.status === "done") {
    await supabase.from("history").insert({
      event_type: "task_completed",
      entity_id: body.id,
      entity_title: data?.title,
    });
  }

  return NextResponse.json(data, { status: 200 });
}

/** DELETE /api/tasks?id=... — remove a task. */
export async function DELETE(req: NextRequest) {
  const supabase = getServerClient();
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("history").insert({
    event_type: "task_deleted",
    entity_id: id,
  });

  return new NextResponse(null, { status: 204 });
}
