import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { DRAFT_MODEL, getAnthropic } from "@/lib/anthropic";
import type { Email, Knowledge } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OWNER = "Ameet Zaveri (GSL Innovation Factory)";

function buildKnowledgeText(rows: Knowledge[]): string {
  if (!rows.length) {
    return "(No knowledge base entries yet. Draft from the email context alone and keep it safe and professional.)";
  }
  const byKind: Record<string, Knowledge[]> = {};
  for (const r of rows) (byKind[r.kind] ??= []).push(r);
  return Object.entries(byKind)
    .map(
      ([kind, items]) =>
        `## ${kind.toUpperCase()}\n` +
        items.map((i) => `- ${i.title}: ${i.content}`).join("\n")
    )
    .join("\n\n");
}

/**
 * POST /api/draft  { emailId, instruction? }
 * Drafts a reply to the email using the knowledge base ("clone database").
 * Saves the draft on the email row and returns it.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  const supabase = getServerClient();

  const { data: email, error: emailErr } = await supabase
    .from("emails")
    .select("*")
    .eq("id", body.emailId)
    .single<Email>();
  if (emailErr || !email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // Load knowledge. The table may not exist yet (002 migration) — degrade gracefully.
  let knowledge: Knowledge[] = [];
  const { data: kRows } = await supabase
    .from("knowledge")
    .select("*")
    .order("created_at", { ascending: false });
  if (Array.isArray(kRows)) knowledge = kRows as Knowledge[];

  let client: Anthropicish;
  try {
    client = getAnthropic();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Anthropic not configured" },
      { status: 500 }
    );
  }

  const systemPrompt = `You draft email replies on behalf of ${OWNER}.

Write in the first person as ${OWNER}. Be concise, warm, and decisive — the tone of a busy founder who respects the reader's time. Use the knowledge base below for facts, pricing, names, policies, and the owner's writing style. Never invent commitments, numbers, or dates that aren't supported by the email or the knowledge base; if something needs the owner's input, leave a clearly marked [bracketed placeholder].

Output ONLY the email body (no subject line, no "Here is the draft" preamble, no markdown).

# KNOWLEDGE BASE
${buildKnowledgeText(knowledge)}`;

  const userPrompt = `Draft a reply to this email.

From: ${email.from_name}${email.from_email ? ` <${email.from_email}>` : ""}
Subject: ${email.subject}
Received: ${email.received_date}
Summary / content:
${email.summary ?? "(no summary available)"}

${body.instruction ? `Special instruction from ${OWNER}: ${body.instruction}` : ""}`;

  let draft = "";
  try {
    const resp = await client.messages.create({
      model: DRAFT_MODEL,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });
    for (const block of resp.content) {
      if (block.type === "text") draft += block.text;
    }
    draft = draft.trim();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Draft failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  await supabase.from("emails").update({ draft }).eq("id", email.id);
  await supabase.from("history").insert({
    event_type: "email_drafted",
    entity_id: email.id,
    entity_title: email.subject,
  });

  return NextResponse.json({ draft }, { status: 200 });
}

// Minimal structural type so we don't import the SDK type surface here.
type Anthropicish = ReturnType<typeof getAnthropic>;
