"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BUSINESSES, TOP_N_OPTIONS } from "@/lib/constants";

interface Result {
  rank: number;
  nomineeId: string;
  name: string;
  votes: number;
  selfVotes: number;
  byBusiness: Record<string, number>;
  nominations: { nominator: string; isSelf: boolean; business: string; justification: string; createdAt: string }[];
}

interface Payload {
  summary: { totalNominations: number; totalNominees: number; totalEmployees: number; selfNominations: number };
  results: Result[];
}

export default function AdminPage() {
  const router = useRouter();
  const [top, setTop] = useState<string>("10");
  const [business, setBusiness] = useState<string>("All");
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/results?top=${top}&business=${encodeURIComponent(business)}`);
    if (res.status === 401) {
      router.replace("/admin/login");
      return;
    }
    const json = await res.json();
    if (!res.ok) setError(json.error || "Could not load results.");
    else setData(json);
    setLoading(false);
  }, [top, business, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  function exportCsv() {
    if (!data) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [["Rank", "Nominee", "Total votes", "Self votes", "Nominated by", "Business", "Justification"].map(esc).join(",")];
    for (const r of data.results) {
      for (const n of r.nominations) {
        lines.push([r.rank, r.name, r.votes, r.selfVotes, n.nominator, n.business, n.justification].map(esc).join(","));
      }
    }
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nominations-top-${top}-${business}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const max = data?.results[0]?.votes ?? 1;

  return (
    <main className="shell wide">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">★</span> Nomination results</div>
        <div className="who">
          <button className="btn ghost small" onClick={load}>Refresh</button>
          <button className="btn ghost small" onClick={logout}>Sign out</button>
        </div>
      </header>

      {data && (
        <div className="stats">
          <div className="stat"><div className="n">{data.summary.totalNominations}</div><div className="l">Nominations{business !== "All" ? ` (${business})` : ""}</div></div>
          <div className="stat"><div className="n">{data.summary.totalNominees}</div><div className="l">Unique nominees</div></div>
          <div className="stat"><div className="n">{data.summary.selfNominations}</div><div className="l">Self-nominations</div></div>
          <div className="stat"><div className="n">{data.summary.totalEmployees}</div><div className="l">Employees</div></div>
        </div>
      )}

      <section className="card">
        <div className="toolbar">
          <div className="group">
            <span id="top-label">Show</span>
            <div className="seg" role="group" aria-labelledby="top-label">
              {TOP_N_OPTIONS.map((n) => (
                <button key={n} aria-pressed={top === String(n)} onClick={() => setTop(String(n))}>Top {n}</button>
              ))}
              <button aria-pressed={top === "all"} onClick={() => setTop("all")}>All</button>
            </div>
          </div>
          <div className="group">
            <span>Business</span>
            <select value={business} onChange={(e) => setBusiness(e.target.value)} aria-label="Filter by business">
              <option value="All">All businesses</option>
              {BUSINESSES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <button className="btn ghost small" onClick={exportCsv} disabled={!data || data.results.length === 0}>
            Export CSV
          </button>
        </div>

        {error && <div className="alert error" role="alert">{error}</div>}
        {loading && !data && <p className="empty">Loading…</p>}

        {data && data.results.length === 0 && !loading && <p className="empty">No nominations yet.</p>}

        {data && data.results.length > 0 && (
          <ol className="rank-list">
            {data.results.map((r) => {
              const expanded = open === r.nomineeId;
              return (
                <li key={r.nomineeId} className={`rank-item ${r.rank === 1 ? "gold" : ""}`}>
                  <button className="rank-row" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : r.nomineeId)}>
                    <span className="rank-no">{r.rank}</span>
                    <span>
                      <span className="rank-name">{r.name}</span>
                      <span className="bar"><i style={{ width: `${Math.max(4, (r.votes / max) * 100)}%` }} /></span>
                    </span>
                    <span className="votes"><b>{r.votes}</b><small>{r.votes === 1 ? "vote" : "votes"}</small></span>
                  </button>
                  {expanded && (
                    <div className="detail">
                      <div className="meta">
                        {BUSINESSES.filter((b) => r.byBusiness[b] > 0).map((b) => (
                          <span key={b} className="badge">{b}: {r.byBusiness[b]}</span>
                        ))}
                        {r.selfVotes > 0 && <span>Includes {r.selfVotes} self-nomination{r.selfVotes > 1 ? "s" : ""}</span>}
                      </div>
                      {r.nominations.map((n, i) => (
                        <div key={i}>
                          <div className="meta">
                            <strong>{n.isSelf ? "Self-nomination" : `Nominated by ${n.nominator}`}</strong>
                            <span>· {n.business}</span>
                          </div>
                          <div className="quote">{n.justification}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {data && top !== "all" && data.results.length > Number(top) && (
          <p className="hint">Showing more than {top} because of ties at the cut-off.</p>
        )}
      </section>
    </main>
  );
}
