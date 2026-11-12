import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

/** All employees (name + email, so duplicates of a name can be told apart) for the "add admin" picker. Admins only. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const { data, error } = await db()
    .from("employees")
    .select("id, name, email, is_admin")
    .order("name", { ascending: true })
    .range(0, 9999);
  if (error) return NextResponse.json({ error: "Could not load employees." }, { status: 500 });

  return NextResponse.json({ employees: data });
}
