"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not sign in.");
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
        <p className="lead">Use your work email and your telephone number as the password.</p>

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
            <label htmlFor="phone">Telephone number (password)</label>
            <input
              id="phone"
              type="password"
              inputMode="tel"
              autoComplete="current-password"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 08031234567"
              required
            />
            <p className="hint">Spaces, dashes and +234 are fine.</p>
          </div>
          {error && <div className="alert error" role="alert">{error}</div>}
          <button className="btn block" type="submit" disabled={busy || !email || !phone}>
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
