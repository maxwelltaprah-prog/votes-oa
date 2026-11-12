import { NextResponse } from "next/server";
import { db, keyKind, supabaseHost } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Setup check: open /api/health in a browser.
 * Shows whether each environment variable is present and valid, which Supabase project the app uses,
 * and how many employees/admins it can see. Never shows any secret value, name, email or password.
 */
export async function GET() {
  const secret = (process.env.SESSION_SECRET || "").trim();
  const kind = keyKind();

  const env = {
    SUPABASE_URL: supabaseHost() ? "ok" : process.env.SUPABASE_URL ? "invalid (must look like https://abcdxyz.supabase.co)" : "missing",
    supabase_project: supabaseHost() || null,
    SUPABASE_SERVICE_ROLE_KEY:
      kind === "secret" || kind === "service_role"
        ? `ok (${kind} key)`
        : kind === "missing"
          ? "missing"
          : kind === "publishable" || kind === "anon"
            ? "WRONG: this is the Publishable/anon key; use the Secret key"
            : "unrecognised format (expected sb_secret_... or a service_role key)",
    SESSION_SECRET: !secret ? "missing" : secret.length < 16 ? `too short (${secret.length} chars, need 16+)` : "ok",
  };

  const database: Record<string, unknown> = {};
  try {
    const c = db();
    const all = await c.from("employees").select("id", { count: "exact", head: true });
    if (all.error) {
      database.error = all.error.message;
    } else {
      database.employees = all.count ?? 0;
      const admins = await c.from("employees").select("id", { count: "exact", head: true }).eq("is_admin", true);
      database.admins = admins.error ? `error: ${admins.error.message}` : admins.count ?? 0;
      const pw = await c.from("employees").select("dob_hash").limit(1);
      database.dob_hash_column = pw.error ? `error: ${pw.error.message}` : "ok";
      const noms = await c.from("nominations").select("id", { count: "exact", head: true });
      database.nominations = noms.error ? `error: ${noms.error.message}` : noms.count ?? 0;
    }
  } catch (e) {
    database.error = e instanceof Error ? e.message : String(e);
  }

  const ok =
    env.SUPABASE_URL === "ok" &&
    env.SUPABASE_SERVICE_ROLE_KEY.startsWith("ok") &&
    env.SESSION_SECRET === "ok" &&
    typeof database.employees === "number" &&
    (database.employees as number) > 0 &&
    database.dob_hash_column === "ok" &&
    typeof database.admins === "number";

  return NextResponse.json({ ok, env, database }, { headers: { "Cache-Control": "no-store" } });
}
