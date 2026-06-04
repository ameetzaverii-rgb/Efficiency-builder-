import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/people — team directory, alphabetical. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/people { name, email?, role?, team?, note? } */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const row = {
    id: `ppl_${crypto.randomUUID()}`,
    name: body.name,
    email: body.email ?? null,
    role: body.role ?? null,
    team: body.team ?? null,
    note: body.note ?? null,
  };
  const { data, error } = await supabase
    .from("people")
    .insert(row)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/** DELETE /api/people?id=... */
export async function DELETE(req: NextRequest) {
  const supabase = getServerClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
