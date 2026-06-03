import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import {
  fetchFlaggedEmails,
  fetchTodoTasks,
  getAccessToken,
  graphClient,
} from "@/lib/microsoft-graph";
import type { RefreshResult } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * M365 sync endpoint. Triggered by the Vercel cron (8am IST) or manually.
 * Protected with CRON_SECRET — accepts either the Vercel cron Authorization
 * header (`Bearer <CRON_SECRET>`) or an `x-cron-secret` header.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    const headerSecret = req.headers.get("x-cron-secret");
    const ok =
      auth === `Bearer ${expected}` || headerSecret === expected;
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getServerClient();

  try {
    const token = await getAccessToken();
    const client = graphClient(token);

    const [emails, tasks] = await Promise.all([
      fetchFlaggedEmails(client),
      fetchTodoTasks(client),
    ]);

    let emailsAdded = 0;
    if (emails.length) {
      const { data, error } = await supabase
        .from("emails")
        .upsert(emails, { onConflict: "m365_message_id", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      emailsAdded = data?.length ?? 0;
    }

    let tasksAdded = 0;
    if (tasks.length) {
      const { data, error } = await supabase
        .from("tasks")
        .upsert(tasks, { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      tasksAdded = data?.length ?? 0;
    }

    const result: RefreshResult = {
      tasksAdded,
      emailsAdded,
      timestamp: new Date().toISOString(),
    };

    await supabase.from("history").insert({
      event_type: "refresh",
      entity_title: "M365 sync",
      metadata: result,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("history").insert({
      event_type: "refresh_failed",
      entity_title: "M365 sync",
      metadata: { error: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
