import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { SEED_EMAILS, SEED_TASKS } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

/**
 * One-time data loader. Visit /api/seed?confirm=yes to populate the database
 * with the curated starter emails and tasks. Safe to run more than once —
 * rows are upserted by their stable id, so nothing duplicates.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("confirm") !== "yes") {
    return NextResponse.json(
      {
        message:
          "Add ?confirm=yes to this URL to load your starter emails and tasks.",
      },
      { status: 400 }
    );
  }

  const supabase = getServerClient();

  const now = new Date().toISOString();
  const emails = SEED_EMAILS.map((e) => ({ ...e, created_at: now }));
  const tasks = SEED_TASKS.map((t) => ({ ...t, created_at: now }));

  const { error: emailErr, count: emailCount } = await supabase
    .from("emails")
    .upsert(emails, { onConflict: "id", count: "exact" });
  if (emailErr) {
    return NextResponse.json({ error: emailErr.message }, { status: 500 });
  }

  const { error: taskErr, count: taskCount } = await supabase
    .from("tasks")
    .upsert(tasks, { onConflict: "id", count: "exact" });
  if (taskErr) {
    return NextResponse.json({ error: taskErr.message }, { status: 500 });
  }

  await supabase.from("history").insert({
    event_type: "seed",
    entity_title: "Loaded starter emails & tasks",
    metadata: { emails: emails.length, tasks: tasks.length },
  });

  return NextResponse.json(
    {
      ok: true,
      emailsLoaded: emailCount ?? emails.length,
      tasksLoaded: taskCount ?? tasks.length,
      message: "Done! Go back to the dashboard and refresh.",
    },
    { status: 200 }
  );
}
