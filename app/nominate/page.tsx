"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Combobox from "../components/Combobox";
import { BUSINESSES, DEPARTMENTS, JUSTIFICATION_MAX, JUSTIFICATION_MIN } from "@/lib/constants";

interface Submitted {
  isSelf: boolean;
  business: string;
  department?: string | null;
  justification: string;
  nomineeName: string;
}

export default function NominatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; isAdmin?: boolean } | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [target, setTarget] = useState<"self" | "other">("self");
  const [nomineeId, setNomineeId] = useState("");
  const [business, setBusiness] = useState("");
  const [department, setDepartment] = useState("");
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      if (meRes.status === 401) {
        router.replace("/");
        return;
      }
      const me = await meRes.json();
      setUser(me.user);
      if (me.nomination) {
        setSubmitted(me.nomination);
      } else {
        const empRes = await fetch("/api/employees");
        if (empRes.ok) setEmployees((await empRes.json()).employees);
      }
      setLoading(false);
    })();
  }, [router]);

  const options = useMemo(() => employees.map((e) => ({ id: e.id, label: e.name })), [employees]);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (target === "other" && !nomineeId) return setError("Select the nominee from the list.");
    if (!business) return setError("Select a business.");
    if (!department) return setError("Select a department.");
    if (justification.trim().length < JUSTIFICATION_MIN)
      return setError(`Justification must be at least ${JUSTIFICATION_MIN} characters.`);

    setBusy(true);
    try {
      const res = await fetch("/api/nominate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, nomineeId, business, department, justification }),
      });
      const data = await res.json();
      if (res.status === 401) return router.replace("/");
      if (!res.ok) return setError(data.error || "Could not submit.");
      setSubmitted(data.nomination);
      setJustSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="shell">
        <p className="lead">Loading…</p>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">★</span> Nomination Portal
        </div>
        <div className="who">
          <span>{user?.name}</span>
          {user?.isAdmin && <Link className="btn ghost small" href="/admin">Admin dashboard</Link>}
          <button className="btn ghost small" onClick={logout}>Sign out</button>
        </div>
      </header>

      {submitted ? (
        <section className="card" aria-live="polite">
          <h1>{justSubmitted ? "Thank you! Nomination submitted" : "Your nomination"}</h1>
          <p className="lead">
            {justSubmitted
              ? "Your nomination has been recorded. Each employee can submit one nomination."
              : "You have already submitted your nomination. Each employee can submit one."}
          </p>
          <dl className="summary">
            <div>
              <dt>Nominator</dt>
              <dd>{user?.name}</dd>
            </div>
            <div>
              <dt>Nominee</dt>
              <dd>
                {submitted.nomineeName} {submitted.isSelf && <span className="badge">Self-nomination</span>}
              </dd>
            </div>
            <div>
              <dt>Business</dt>
              <dd>{submitted.business}</dd>
            </div>
            {submitted.department && (
              <div>
                <dt>Department</dt>
                <dd>{submitted.department}</dd>
              </div>
            )}
            <div>
              <dt>Justification</dt>
              <dd className="quote">{submitted.justification}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <form className="card" onSubmit={onSubmit} noValidate>
          <h1>Safety Award Nomination</h1>
          <p className="lead">
            The Safety Award is to recognize non-safety employees who proactively demonstrate safety leadership,
            identify and reduce risks, comply with safety standards, engage others, and deliver measurable,
            sustainable improvements that prevent incidents.
          </p>

          <div className="field">
            <label htmlFor="nominator">Your name</label>
            <input id="nominator" type="text" value={user?.name ?? ""} readOnly />
          </div>

          <div className="field">
            <span className="label" id="target-label">Who are you nominating?</span>
            <div className="choice-row" role="radiogroup" aria-labelledby="target-label">
              <label className={`choice ${target === "self" ? "active" : ""}`}>
                <input type="radio" name="target" checked={target === "self"} onChange={() => setTarget("self")} />
                <div><strong>Myself</strong><span>Self-nomination</span></div>
              </label>
              <label className={`choice ${target === "other" ? "active" : ""}`}>
                <input type="radio" name="target" checked={target === "other"} onChange={() => setTarget("other")} />
                <div><strong>Someone else</strong><span>Nominate a colleague</span></div>
              </label>
            </div>
          </div>

          {target === "other" && (
            <div className="field">
              <label htmlFor="nominee">Nominee name</label>
              <Combobox
                inputId="nominee"
                options={options}
                value={nomineeId}
                onChange={setNomineeId}
                placeholder="Search and select an employee…"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="business">Business</label>
            <select id="business" value={business} onChange={(e) => setBusiness(e.target.value)}>
              <option value="">Select a business…</option>
              {BUSINESSES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="department">Department</label>
            <select id="department" value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">Select a department…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="justification">
              Justification{target === "other" ? " for this nominee" : ""}
            </label>
            <textarea
              id="justification"
              value={justification}
              maxLength={JUSTIFICATION_MAX}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Why do they deserve this nomination?"
            />
            <div className="counter">{justification.length} / {JUSTIFICATION_MAX}</div>
          </div>

          {error && <div className="alert error" role="alert">{error}</div>}

          <button className="btn block" type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit nomination"}
          </button>
          <p className="hint" style={{ textAlign: "center" }}>You can only submit once, so double-check before sending.</p>
        </form>
      )}
    </main>
  );
}
