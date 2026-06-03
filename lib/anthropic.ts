import Anthropic from "@anthropic-ai/sdk";

/** Server-side Anthropic client. Never import into client code — uses a secret key. */
export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }
  return new Anthropic({ apiKey });
}

export const DRAFT_MODEL = "claude-opus-4-8";
