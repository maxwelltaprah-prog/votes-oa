import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Server-side only. Uses the service role / secret key, so never import this from a client component. */
export function db(): SupabaseClient {
  if (client) return client;

  // trim(): a pasted value often carries a trailing space or newline, which breaks it silently.
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url) throw new Error("SUPABASE_URL is not set.");
  if (!/^https?:\/\//.test(url)) {
    throw new Error("SUPABASE_URL must start with https:// (it should look like https://abcdxyz.supabase.co).");
  }
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set.");

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
