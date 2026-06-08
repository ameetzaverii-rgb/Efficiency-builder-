import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const DEFAULT_JQL =
  "assignee = currentUser() AND statusCategory != Done ORDER BY updated DESC";

function creds() {
  const base = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  return { base, email, token };
}

/**
 * GET /api/jira?jql=...
 * Returns issues from Jira Cloud for the given JQL (defaults to "assigned to me,
 * not done"). Requires JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN env vars.
 */
export async function GET(req: NextRequest) {
  const { base, email, token } = creds();
  if (!base || !email || !token) {
    return NextResponse.json(
      { configured: false, issues: [] },
      { status: 200 }
    );
  }

  const jql = req.nextUrl.searchParams.get("jql") || DEFAULT_JQL;
  const auth = Buffer.from(`${email}:${token}`).toString("base64");

  try {
    const res = await fetch(`${base}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jql,
        maxResults: 50,
        fields: [
          "summary",
          "status",
          "assignee",
          "priority",
          "duedate",
          "issuetype",
          "project",
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { configured: true, error: `Jira ${res.status}: ${text.slice(0, 300)}` },
        { status: 200 }
      );
    }

    const data = await res.json();
    const issues = (data.issues ?? []).map((i: any) => ({
      key: i.key,
      url: `${base}/browse/${i.key}`,
      summary: i.fields?.summary ?? "",
      status: i.fields?.status?.name ?? "",
      statusCategory: i.fields?.status?.statusCategory?.key ?? "",
      assignee: i.fields?.assignee?.displayName ?? null,
      priority: i.fields?.priority?.name ?? null,
      duedate: i.fields?.duedate ?? null,
      type: i.fields?.issuetype?.name ?? null,
      project: i.fields?.project?.name ?? null,
    }));

    return NextResponse.json({ configured: true, issues }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : "Jira request failed" },
      { status: 200 }
    );
  }
}
