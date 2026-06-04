import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/deals — all deals, newest first. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/deals — create a deal. */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const row = {
    id: `deal_${crypto.randomUUID()}`,
    name: body.name,
    partner: body.partner ?? null,
    stage: body.stage ?? "exploring",
    value: body.value ?? null,
    note: body.note ?? null,
    next_step: body.next_step ?? null,
    last_touch: body.last_touch ?? new Date().toISOString().slice(0, 10),
  };
  const { data, error } = await supabase
    .from("deals")
    .insert(row)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/deals — update a deal (e.g. move stage). */
export async function PATCH(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  for (const f of ["name", "partner", "stage", "value", "note", "next_step", "last_touch"]) {
    if (f in body) updates[f] = body[f];
  }
  const { data, error } = await supabase
    .from("deals")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** DELETE /api/deals?id=... */
export async function DELETE(req: NextRequest) {
  const supabase = getServerClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
