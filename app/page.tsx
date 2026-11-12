"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
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
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dob }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || `Server error (${res.status}). Please try again, or tell the administrator.`);
        return;
      }
      router.push("/nominate");
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
          <span className="brand-mark">★</span> Nomination Portal
        </div>
        <h1>Sign in</h1>
        <p className="lead">Use your work email and your date of birth as the password.</p>

        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
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
              required
            />
            <p className="hint">Day first, e.g. 05/03/1990 (5 March 1990). You can also type 05031990.</p>
          </div>
          {error && <div className="alert error" role="alert">{error}</div>}
          <button className="btn block" type="submit" disabled={busy || !email || !dob}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="footer-link">
          Administrator? <Link href="/admin/login">Admin sign in</Link>
        </p>
      </div>
    </main>
  );
}
