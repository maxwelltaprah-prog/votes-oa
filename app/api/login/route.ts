import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { authenticate } from "@/lib/login";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await authenticate(body.email, body.dob);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const e = result.employee;
  await createSession({ sub: e.id, name: e.name, email: e.email, isAdmin: e.is_admin });
  return NextResponse.json({ ok: true, name: e.name, isAdmin: e.is_admin });
}
