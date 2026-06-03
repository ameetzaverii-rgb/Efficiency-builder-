import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client. Uses the public anon key — safe to ship to the
 * client. Call from React components / client-side code only.
 */
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createBrowserClient(url, anonKey);
}

/**
 * Server-side Supabase client using the service-role key. This bypasses RLS, so
 * NEVER import this into client code. Use only inside API route handlers / server
 * components. Cookie plumbing is a no-op because we authenticate with the service
 * role rather than a user session.
 */
export function getServerClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!rawUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  // Tolerate a URL that was pasted with a trailing slash or /rest/v1 suffix.
  const url = rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
