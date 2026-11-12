import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/supabase";
import { createSession } from "@/lib/auth";
import { normalizeDob } from "@/lib/dob";
import { clearFailures, recordFailure, tooManyAttempts } from "@/lib/throttle";

// A valid bcrypt hash used to keep response time similar when the email doesn't exist.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.lJ6WZ9YQ5eZ0o4q5uW8yZc2uXGAa";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const rawDob = String(body.dob || "");

  if (!email || !rawDob.trim()) {
    return NextResponse.json({ error: "Enter your email and date of birth." }, { status: 400 });
  }

  const dob = normalizeDob(rawDob);
  if (!dob) {
    return NextResponse.json(
      { error: "Enter your date of birth as DD/MM/YYYY, for example 05/03/1990." },
      { status: 400 }
    );
  }

  const key = `emp:${email}`;
  if (tooManyAttempts(key)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 15 minutes." },
      { status: 429 }
    );
  }

  const { data: emp, error } = await db()
    .from("employees")
    .select("id, name, email, dob_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  const ok = await bcrypt.compare(dob, emp?.dob_hash ?? DUMMY_HASH);
  if (!emp || !ok) {
    recordFailure(key);
    return NextResponse.json({ error: "Email or date of birth is incorrect." }, { status: 401 });
  }

  clearFailures(key);
  await createSession({ sub: emp.id, role: "employee", name: emp.name, email: emp.email });
  return NextResponse.json({ ok: true, name: emp.name });
}
