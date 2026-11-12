import bcrypt from "bcryptjs";
import { db } from "@/lib/supabase";
import { normalizeDob } from "@/lib/dob";
import { clearFailures, recordFailure, tooManyAttempts } from "@/lib/throttle";

// A valid bcrypt hash used to keep response time similar when the email doesn't exist.
const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.lJ6WZ9YQ5eZ0o4q5uW8yZc2uXGAa";

export interface Employee {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
}

export type AuthResult =
  | { ok: true; employee: Employee }
  | { ok: false; status: number; error: string };

/** Email + date of birth check, shared by the employee and admin sign-in routes. */
export async function authenticate(rawEmail: unknown, rawDob: unknown): Promise<AuthResult> {
  const email = String(rawEmail || "").trim().toLowerCase();
  const dobText = String(rawDob || "");

  if (!email || !dobText.trim()) {
    return { ok: false, status: 400, error: "Enter your email and date of birth." };
  }

  const dob = normalizeDob(dobText);
  if (!dob) {
    return { ok: false, status: 400, error: "Enter your date of birth as DD/MM/YYYY, for example 05/03/1990." };
  }

  const key = `emp:${email}`;
  if (tooManyAttempts(key)) {
    return { ok: false, status: 429, error: "Too many failed attempts. Please try again in 15 minutes." };
  }

  const { data: emp, error } = await db()
    .from("employees")
    .select("id, name, email, is_admin, dob_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: "Something went wrong. Please try again." };
  }

  if (!emp) {
    // If the app can't see ANY employees, every login fails the same way. Say so instead of "incorrect".
    const { count } = await db().from("employees").select("id", { count: "exact", head: true });
    if (!count) {
      return {
        ok: false,
        status: 500,
        error:
          "Setup problem: the app's database has no employees. Either the employee import has not been run, or Vercel's SUPABASE_URL points to a different Supabase project than the one you imported into. Open /api/health for details.",
      };
    }
  }

  const ok = await bcrypt.compare(dob, emp?.dob_hash ?? DUMMY_HASH);
  if (!emp || !ok) {
    recordFailure(key);
    return { ok: false, status: 401, error: "Email or date of birth is incorrect." };
  }

  clearFailures(key);
  return { ok: true, employee: { id: emp.id, name: emp.name, email: emp.email, is_admin: emp.is_admin === true } };
}
