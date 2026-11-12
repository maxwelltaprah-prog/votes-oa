import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { BUSINESSES, TOP_N_OPTIONS } from "@/lib/constants";

interface Row {
  nominee_id: string;
  nominator_id: string;
  is_self: boolean;
  business: string;
  justification: string;
  created_at: string;
  nominee: { name: string } | { name: string }[] | null;
  nominator: { name: string } | { name: string }[] | null;
}

const nameOf = (x: Row["nominee"]) => (Array.isArray(x) ? x[0]?.name : x?.name) ?? "Unknown";

export async function GET(req: Request) {
  const admin = await requireRole("admin");
  if (!admin) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const url = new URL(req.url);
  const topParam = url.searchParams.get("top") || "10";
  const businessParam = url.searchParams.get("business") || "All";

  const top = topParam === "all" ? Infinity : Number(topParam);
  if (topParam !== "all" && !(TOP_N_OPTIONS as readonly number[]).includes(top)) {
    return NextResponse.json({ error: "top must be 3, 5, 10 or all." }, { status: 400 });
  }
  if (businessParam !== "All" && !(BUSINESSES as readonly string[]).includes(businessParam)) {
    return NextResponse.json({ error: "Unknown business." }, { status: 400 });
  }

  let q = db()
    .from("nominations")
    .select(
      "nominee_id, nominator_id, is_self, business, justification, created_at, nominee:employees!nominations_nominee_id_fkey(name), nominator:employees!nominations_nominator_id_fkey(name)"
    )
    .order("created_at", { ascending: false })
    .range(0, 49999);
  if (businessParam !== "All") q = q.eq("business", businessParam);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: "Could not load results." }, { status: 500 });

  const rows = (data ?? []) as unknown as Row[];

  const byNominee = new Map<
    string,
    {
      nomineeId: string;
      name: string;
      votes: number;
      selfVotes: number;
      byBusiness: Record<string, number>;
      nominations: { nominator: string; isSelf: boolean; business: string; justification: string; createdAt: string }[];
    }
  >();

  for (const r of rows) {
    let e = byNominee.get(r.nominee_id);
    if (!e) {
      e = {
        nomineeId: r.nominee_id,
        name: nameOf(r.nominee),
        votes: 0,
        selfVotes: 0,
        byBusiness: Object.fromEntries(BUSINESSES.map((b) => [b, 0])),
        nominations: [],
      };
      byNominee.set(r.nominee_id, e);
    }
    e.votes += 1;
    if (r.is_self) e.selfVotes += 1;
    e.byBusiness[r.business] = (e.byBusiness[r.business] ?? 0) + 1;
    e.nominations.push({
      nominator: r.is_self ? nameOf(r.nominee) : nameOf(r.nominator),
      isSelf: r.is_self,
      business: r.business,
      justification: r.justification,
      createdAt: r.created_at,
    });
  }

  const sorted = [...byNominee.values()].sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name));

  // Competition ranking: ties share a rank (1, 2, 2, 4 ...). Include everyone tied at the cut-off.
  let lastVotes = -1;
  let lastRank = 0;
  const ranked = sorted.map((n, i) => {
    const rank = n.votes === lastVotes ? lastRank : i + 1;
    lastVotes = n.votes;
    lastRank = rank;
    return { ...n, rank };
  });
  const cutoff = top === Infinity ? Infinity : top;
  const results = ranked.filter((n) => n.rank <= cutoff);

  const { count: employeeCount } = await db().from("employees").select("id", { count: "exact", head: true });

  return NextResponse.json({
    filters: { top: topParam, business: businessParam },
    summary: {
      totalNominations: rows.length,
      totalNominees: byNominee.size,
      totalEmployees: employeeCount ?? 0,
      selfNominations: rows.filter((r) => r.is_self).length,
    },
    results,
  });
}
