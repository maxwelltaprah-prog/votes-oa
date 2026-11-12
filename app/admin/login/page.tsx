"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dob }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Server error (${res.status}). Please try again, or tell the administrator.`);
        return;
      }
      router.push("/admin");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <div className="card center-card">
        <div className="brand" style={{ marginBottom: 18 }}>
          <span className="brand-mark">★</span> Admin
        </div>
        <h1>Admin sign in</h1>
        <p className="lead">Sign in with your work email and date of birth to view results and manage admins.</p>
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth (password)</label>
            <input
              id="dob"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              placeholder="DD/MM/YYYY"
            />
            <p className="hint">Day first, e.g. 05/03/1990.</p>
          </div>
          {error && <div className="alert error" role="alert">{error}</div>}
          <button className="btn block" type="submit" disabled={busy || !email || !dob}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="footer-link"><Link href="/">← Employee sign in</Link></p>
      </div>
    </main>
  );
}
