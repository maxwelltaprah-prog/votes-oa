import { NextResponse } from "next/server";

/**
 * Turn an unexpected exception into a JSON reply (instead of a bare 500 page) and log the details
 * to the server logs (Vercel > Deployments > Logs).
 * Setup problems (a missing/short/invalid environment variable) are reported by name only, never by value.
 */
export function serverError(e: unknown, where: string) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[${where}]`, e);

  const isConfig =
    /^(SESSION_SECRET|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY) /.test(message) && /not set|too short|must start with/.test(message);

  if (isConfig) {
    return NextResponse.json(
      {
        error: `Setup problem: ${message} Fix it in Vercel → Settings → Environment Variables, then redeploy.`,
        code: "config",
      },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { error: "Something went wrong on the server. Please try again, and tell the administrator if it keeps happening.", code: "server" },
    { status: 500 }
  );
}
