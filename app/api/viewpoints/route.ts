import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/viewpoints?entityId=... — viewpoints for an item, oldest first. */
export async function GET(req: NextRequest) {
  const supabase = getServerClient();
  const entityId = req.nextUrl.searchParams.get("entityId");
  if (!entityId) {
    return NextResponse.json({ error: "entityId required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("viewpoints")
    .select("*")
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/viewpoints { entityId, entityType?, author?, content } */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.entityId || !body?.content) {
    return NextResponse.json(
      { error: "entityId and content are required" },
      { status: 400 }
    );
  }
  const row = {
    id: `vp_${crypto.randomUUID()}`,
    entity_id: body.entityId,
    entity_type: body.entityType ?? "email",
    author: body.author ?? null,
    content: body.content,
  };
  const { data, error } = await supabase
    .from("viewpoints")
    .insert(row)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/** DELETE /api/viewpoints?id=... */
export async function DELETE(req: NextRequest) {
  const supabase = getServerClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const { error } = await supabase.from("viewpoints").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
