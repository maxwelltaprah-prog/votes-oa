import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { BUSINESSES, FUNCTIONS, JUSTIFICATION_MAX, JUSTIFICATION_MIN } from "@/lib/constants";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const target = body.target === "self" || body.target === "other" ? body.target : null;
  const business = String(body.business || "");
  const businessFunction = String(body.businessFunction || "");
  const justification = String(body.justification || "").trim();
  const nomineeId = String(body.nomineeId || "");

  if (!target) {
    return NextResponse.json({ error: "Choose whether you are nominating yourself or someone else." }, { status: 400 });
  }
  if (!(BUSINESSES as readonly string[]).includes(business)) {
    return NextResponse.json({ error: "Select a business." }, { status: 400 });
  }
  if (!(FUNCTIONS as readonly string[]).includes(businessFunction)) {
    return NextResponse.json({ error: "Select a function." }, { status: 400 });
  }
  if (justification.length < JUSTIFICATION_MIN) {
    return NextResponse.json(
      { error: `Justification must be at least ${JUSTIFICATION_MIN} characters.` },
      { status: 400 }
    );
  }
  if (justification.length > JUSTIFICATION_MAX) {
    return NextResponse.json(
      { error: `Justification must be at most ${JUSTIFICATION_MAX} characters.` },
      { status: 400 }
    );
  }

  let finalNomineeId = session.sub;
  let nomineeName = session.name;

  if (target === "other") {
    if (!nomineeId) {
      return NextResponse.json({ error: "Select the nominee." }, { status: 400 });
    }
    if (nomineeId === session.sub) {
      return NextResponse.json({ error: "To nominate yourself, choose \"Myself\"." }, { status: 400 });
    }
    const { data: nominee } = await db().from("employees").select("id, name").eq("id", nomineeId).maybeSingle();
    if (!nominee) {
      return NextResponse.json({ error: "That nominee was not found." }, { status: 400 });
    }
    finalNomineeId = nominee.id;
    nomineeName = nominee.name;
  }

  const { error } = await db().from("nominations").insert({
    nominator_id: session.sub,
    nominee_id: finalNomineeId,
    is_self: target === "self",
    business,
    business_function: businessFunction,
    justification,
  });

  if (error) {
    // 23505 = unique_violation (one nomination per employee)
    if (error.code === "23505") {
      return NextResponse.json({ error: "You have already submitted your nomination." }, { status: 409 });
    }
    if (/business_function/.test(error.message)) {
      console.error("[api/nominate]", error);
      return NextResponse.json(
        { error: "Setup problem: the Function column is missing. An administrator must run supabase/migrations/004_add_function.sql." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Could not save your nomination. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    nomination: { isSelf: target === "self", business, businessFunction, justification, nomineeName },
  });
}
