import { NextResponse } from "next/server";

/**
 * Turn an unexpected exception into a JSON reply (instead of a bare 500 page) and log the details
 * to the server logs (Vercel > Deployments > Logs). A missing environment variable is reported plainly.
 */
export function serverError(e: unknown, where: string) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`[${where}]`, e);

  if (/SESSION_SECRET|SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY/.test(message)) {
    return NextResponse.json(
      {
        error:
          "The server is not set up yet: a required environment variable is missing on Vercel (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SESSION_SECRET). Add it, then redeploy.",
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
