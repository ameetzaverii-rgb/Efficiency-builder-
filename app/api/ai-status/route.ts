import { NextResponse } from "next/server";
import { activeProvider } from "@/lib/ai";

export const dynamic = "force-dynamic";

/** GET /api/ai-status — which AI provider is configured (for the header pill). */
export async function GET() {
  return NextResponse.json(
    { provider: activeProvider() ?? "none" },
    { status: 200 }
  );
}
