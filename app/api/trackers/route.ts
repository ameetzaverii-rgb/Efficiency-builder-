import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/trackers — all trackers, newest first. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("trackers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}

/** POST /api/trackers { title, url, type?, note? } */
export async function POST(req: NextRequest) {
  const supabase = getServerClient();
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.url) {
    return NextResponse.json(
      { error: "title and url are required" },
      { status: 400 }
    );
  }
  const row = {
    id: `trk_${crypto.randomUUID()}`,
    title: body.title,
    url: body.url,
    type: body.type ?? "link",
    note: body.note ?? null,
  };
  const { data, error } = await supabase
    .from("trackers")
    .insert(row)
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

/** DELETE /api/trackers?id=... */
export async function DELETE(req: NextRequest) {
  const supabase = getServerClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const { error } = await supabase.from("trackers").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
