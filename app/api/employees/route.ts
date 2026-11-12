import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";

/** Employee names for the nominee dropdown. Only id + name are exposed (never email or date of birth). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await db()
    .from("employees")
    .select("id, name")
    .neq("id", session.sub) // "Myself" is a separate option, so exclude the user from the list
    .order("name", { ascending: true })
    .range(0, 9999);

  if (error) {
    return NextResponse.json({ error: "Could not load employees." }, { status: 500 });
  }
  return NextResponse.json({ employees: data });
}
