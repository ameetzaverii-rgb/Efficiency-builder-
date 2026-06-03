// Seeds the Supabase database with starter emails & tasks.
// Runs in GitHub Actions (which has internet access). Reads:
//   SUPABASE_URL  - project URL (with or without trailing /rest/v1/)
//   SUPABASE_KEY  - service/secret key (bypasses RLS)
import { readFileSync } from "node:fs";

const RAW_URL = process.env.SUPABASE_URL || "";
const KEY = process.env.SUPABASE_KEY || "";

const BASE = RAW_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

if (!BASE || !KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const data = JSON.parse(
  readFileSync(new URL("./seed-data.json", import.meta.url))
);

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function upsert(table, rows) {
  const res = await fetch(`${BASE}/rest/v1/${table}?on_conflict=id`, {
    method: "POST",
    headers: {
      ...headers,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(rows),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`❌ ${table}: HTTP ${res.status} — ${text.slice(0, 600)}`);
    return false;
  }
  let arr = [];
  try {
    arr = JSON.parse(text);
  } catch {}
  console.log(`✅ ${table}: upserted ${arr.length || rows.length} rows`);
  return true;
}

async function count(table) {
  const res = await fetch(`${BASE}/rest/v1/${table}?select=id`, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
  });
  return res.headers.get("content-range");
}

async function main() {
  console.log(`Target: ${BASE}`);

  const okE = await upsert("emails", data.emails);
  const okT = await upsert("tasks", data.tasks);

  if (okE && okT) {
    await fetch(`${BASE}/rest/v1/history`, {
      method: "POST",
      headers,
      body: JSON.stringify([
        {
          event_type: "seed",
          entity_title: "Loaded starter emails & tasks",
          metadata: { emails: data.emails.length, tasks: data.tasks.length },
        },
      ]),
    });
  }

  console.log(`emails total -> ${await count("emails")}`);
  console.log(`tasks total  -> ${await count("tasks")}`);

  if (!okE || !okT) process.exit(1);
  console.log("🎉 Seed complete.");
}

main().catch((e) => {
  console.error("❌ Unexpected error:", e?.message || e);
  process.exit(1);
});
