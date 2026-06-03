import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/knowledge — all knowledge entries, newest first. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("knowledge")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    // Table may not exist yet (002 migration not run) — return empty, not 500.
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/knowledge — add an entry. */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.content) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 }
    );
  }
  const row = {
    id: `kn_${crypto.randomUUID()}`,
    kind: body.kind ?? "fact",
    title: body.title,
    content: body.content,
  };
  const { data, error } = await supabase
    .from("knowledge")
    .insert(row)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/** DELETE /api/knowledge?id=... */
export async function DELETE(req: NextRequest) {
  const supabase = getServerClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const { error } = await supabase.from("knowledge").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
