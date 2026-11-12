import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** List current admins. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const { data, error } = await db()
    .from("employees")
    .select("id, name, email")
    .eq("is_admin", true)
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: "Could not load admins." }, { status: 500 });

  return NextResponse.json({ admins: data, me: admin.sub });
}

/** Make an employee an admin. Body: { employeeId } */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const employeeId = String(body.employeeId || "");
  if (!UUID.test(employeeId)) {
    return NextResponse.json({ error: "Select an employee." }, { status: 400 });
  }

  const { data, error } = await db()
    .from("employees")
    .update({ is_admin: true })
    .eq("id", employeeId)
    .select("id, name, email")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Could not add the admin." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "That employee was not found." }, { status: 404 });

  return NextResponse.json({ ok: true, admin: data });
}

/** Remove admin rights. Body: { employeeId }. You cannot remove yourself, so there is always at least one admin. */
export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const employeeId = String(body.employeeId || "");
  if (!UUID.test(employeeId)) {
    return NextResponse.json({ error: "Select an admin to remove." }, { status: 400 });
  }
  if (employeeId === admin.sub) {
    return NextResponse.json({ error: "You can't remove your own admin access." }, { status: 400 });
  }

  const { error } = await db().from("employees").update({ is_admin: false }).eq("id", employeeId);
  if (error) return NextResponse.json({ error: "Could not remove the admin." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
