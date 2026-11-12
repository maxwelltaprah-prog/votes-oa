import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";

/** Returns the logged-in employee, plus their existing nomination (if any). */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "employee") {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: nomination } = await db()
    .from("nominations")
    .select("is_self, business, justification, created_at, nominee:employees!nominations_nominee_id_fkey(name)")
    .eq("nominator_id", session.sub)
    .maybeSingle();

  const nomineeRow = nomination?.nominee as { name: string } | { name: string }[] | null | undefined;
  const nomineeName = Array.isArray(nomineeRow) ? nomineeRow[0]?.name : nomineeRow?.name;

  return NextResponse.json({
    user: { id: session.sub, name: session.name, email: session.email },
    nomination: nomination
      ? {
          isSelf: nomination.is_self,
          business: nomination.business,
          justification: nomination.justification,
          createdAt: nomination.created_at,
          nomineeName: nomineeName ?? session.name,
        }
      : null,
  });
}
