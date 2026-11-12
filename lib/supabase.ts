import { createClient, SupabaseClient } from "@supabase/supabase-js";

/** A setup problem (environment variables). Its message names the variable, never its value. */
export class ConfigError extends Error {}

export type KeyKind = "missing" | "secret" | "service_role" | "publishable" | "anon" | "unknown";

/** Work out what kind of Supabase key was configured, without exposing the key. */
export function keyKind(rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY): KeyKind {
  const key = (rawKey || "").trim();
  if (!key) return "missing";
  if (key.startsWith("sb_secret_")) return "secret";
  if (key.startsWith("sb_publishable_")) return "publishable";
  if (key.startsWith("eyJ")) {
    try {
      const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
      if (payload.role === "service_role") return "service_role";
      if (payload.role === "anon") return "anon";
    } catch {
      /* fall through */
    }
  }
  return "unknown";
}

export function supabaseHost(): string {
  try {
    return new URL((process.env.SUPABASE_URL || "").trim()).host;
  } catch {
    return "";
  }
}

let client: SupabaseClient | null = null;

/** Server-side only. Uses the secret / service_role key, so never import this from a client component. */
export function db(): SupabaseClient {
  if (client) return client;

  // trim(): a pasted value often carries a trailing space or newline, which breaks it silently.
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url) throw new ConfigError("SUPABASE_URL is not set.");
  if (!/^https?:\/\//.test(url)) {
    throw new ConfigError("SUPABASE_URL must start with https:// (it should look like https://abcdxyz.supabase.co).");
  }

  const kind = keyKind(key);
  if (kind === "missing") throw new ConfigError("SUPABASE_SERVICE_ROLE_KEY is not set.");
  if (kind === "publishable" || kind === "anon") {
    throw new ConfigError(
      "SUPABASE_SERVICE_ROLE_KEY contains the Publishable (anon) key. It must be the Secret key (starts with sb_secret_) or the legacy service_role key."
    );
  }

  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
