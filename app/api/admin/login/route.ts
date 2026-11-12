import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/supabase";
import { createSession } from "@/lib/auth";
import { clearFailures, recordFailure, tooManyAttempts } from "@/lib/throttle";

const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.lJ6WZ9YQ5eZ0o4q5uW8yZc2uXGAa";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const key = `adm:${email}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  const { data: admin, error } = await db()
    .from("admins")
    .select("id, email, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const ok = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) {
    recordFailure(key);
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  clearFailures(key);
  await createSession({ sub: admin.id, role: "admin", name: "Admin", email: admin.email });
  return NextResponse.json({ ok: true });
}
