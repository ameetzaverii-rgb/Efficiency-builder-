import { getAnthropic, DRAFT_MODEL } from "./anthropic";

// Provider-agnostic text generation. Uses Gemini when GEMINI_API_KEY is set,
// otherwise Anthropic (Claude). Lets the owner pick whichever account has credit.

export type AIProvider = "gemini" | "anthropic";

export function activeProvider(): AIProvider | null {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

interface GenerateOpts {
  system: string;
  user: string;
  maxTokens?: number;
  /** When provided, ask the model for JSON matching this JSON-schema. */
  jsonSchema?: Record<string, unknown>;
}

const NO_KEY =
  "No AI key configured. Add GEMINI_API_KEY (or ANTHROPIC_API_KEY) in Vercel and redeploy.";

export async function generate(opts: GenerateOpts): Promise<string> {
  const provider = activeProvider();
  if (!provider) throw new Error(NO_KEY);
  if (provider === "gemini") return geminiGenerate(opts);
  return anthropicGenerate(opts);
}

async function geminiGenerate({
  system,
  user,
  maxTokens = 2000,
  jsonSchema,
}: GenerateOpts): Promise<string> {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  // For JSON requests, push the shape into the prompt too (robust across models).
  const userText = jsonSchema
    ? `${user}\n\nReturn ONLY valid JSON matching this shape (no markdown, no commentary):\n${JSON.stringify(
        jsonSchema
      )}`
    : user;

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(jsonSchema ? { responseMimeType: "application/json" } : {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 400)}`);
  }
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p: { text?: string }) => p.text ?? "").join("");
  return text.trim();
}

async function anthropicGenerate({
  system,
  user,
  maxTokens = 2000,
  jsonSchema,
}: GenerateOpts): Promise<string> {
  const client = getAnthropic();
  const params: Record<string, unknown> = {
    model: DRAFT_MODEL,
    max_tokens: maxTokens,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: system, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: user }],
  };
  if (jsonSchema) {
    params.output_config = {
      format: { type: "json_schema", schema: jsonSchema },
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resp = await client.messages.create(params as any);
  let text = "";
  for (const block of resp.content) {
    if (block.type === "text") text += block.text;
  }
  return text.trim();
}

/** Parse JSON that may be wrapped in ```json fences. */
export function parseJSON<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
