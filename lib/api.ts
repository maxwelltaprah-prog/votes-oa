import { NextResponse } from "next/server";
import { ConfigError } from "@/lib/supabase";

/**
 * Turn an unexpected exception into a JSON reply (instead of a bare 500 page) and log the details
 * to the server logs (Vercel > Deployments > Logs).
 * Setup problems are reported by variable name only, never by value.
 */
export function serverError(e: unknown, where: string) {
  console.error(`[${where}]`, e);

  if (e instanceof ConfigError) {
    return NextResponse.json(
      {
        error: `Setup problem: ${e.message} Fix it in Vercel → Settings → Environment Variables, then redeploy.`,
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
