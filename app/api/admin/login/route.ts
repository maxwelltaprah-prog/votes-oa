import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { authenticate } from "@/lib/login";
import { serverError } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await authenticate(body.email, body.dob);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const e = result.employee;
    if (!e.is_admin) {
      return NextResponse.json({ error: "This account does not have admin access." }, { status: 403 });
    }

    await createSession({ sub: e.id, name: e.name, email: e.email, isAdmin: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return serverError(e, "api/admin/login");
  }
}
