import "isomorphic-fetch";
import { Client } from "@microsoft/microsoft-graph-client";
import type { Email, Task } from "./types";

/**
 * Exchange the long-lived refresh token for a short-lived Graph access token.
 * Uses the OAuth2 v2 token endpoint for the registered Azure AD app.
 */
export async function getAccessToken(): Promise<string> {
  const tenantId = process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const refreshToken = process.env.MICROSOFT_REFRESH_TOKEN;

  if (!tenantId || !clientId || !clientSecret || !refreshToken) {
    throw new Error("Microsoft Graph environment variables are not fully set");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope:
      "offline_access Mail.Read Mail.ReadWrite Tasks.Read Tasks.ReadWrite User.Read",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Token response did not include an access_token");
  }
  return data.access_token;
}

/** Build an authenticated Graph client from an access token. */
export function graphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  });
}

const ISO_DATE = (value?: string) =>
  (value ? new Date(value) : new Date()).toISOString().slice(0, 10);

/**
 * Fetch flagged Outlook messages and map them onto our Email shape. The mapped
 * rows are not yet persisted — the refresh route upserts them.
 */
export async function fetchFlaggedEmails(client: Client): Promise<Email[]> {
  const res = await client
    .api("/me/messages")
    .filter("flag/flagStatus eq 'flagged'")
    .top(50)
    .select("id,subject,from,receivedDateTime,bodyPreview")
    .orderby("receivedDateTime desc")
    .get();

  const messages: any[] = res?.value ?? [];

  return messages.map((m) => ({
    id: `email_${m.id}`,
    subject: m.subject || "(no subject)",
    from_name: m.from?.emailAddress?.name || "Unknown",
    from_email: m.from?.emailAddress?.address || null,
    received_date: ISO_DATE(m.receivedDateTime),
    tag: "action",
    summary: m.bodyPreview || null,
    draft: null,
    actions: [],
    status: "pending" as const,
    resolved_date: null,
    m365_message_id: m.id,
    created_at: new Date().toISOString(),
  }));
}

/**
 * Fetch Microsoft To Do tasks across all lists and map them onto our Task shape.
 */
export async function fetchTodoTasks(client: Client): Promise<Task[]> {
  const lists = await client.api("/me/todo/lists").get();
  const out: Task[] = [];

  for (const list of lists?.value ?? []) {
    const tasksRes = await client
      .api(`/me/todo/lists/${list.id}/tasks`)
      .filter("status ne 'completed'")
      .top(50)
      .get();

    for (const t of tasksRes?.value ?? []) {
      out.push({
        id: `task_${t.id}`,
        title: t.title || "(untitled task)",
        project: list.displayName || "GSL Innovation",
        priority:
          t.importance === "high"
            ? "high"
            : t.importance === "low"
            ? "low"
            : "medium",
        status: "active",
        note: t.body?.content || null,
        actions: [],
        added_date: ISO_DATE(t.createdDateTime),
        done_date: null,
        created_at: new Date().toISOString(),
      });
    }
  }

  return out;
}
