import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** GET /api/insights — entity ids that already have a stored AI insight. */
export async function GET() {
  const supabase = getServerClient();
  const { data, error } = await supabase.from("insights").select("entity_id");
  if (error) {
    return NextResponse.json([], { status: 200 });
  }
  return NextResponse.json(data, { status: 200 });
}
