import { createClient } from "@supabase/supabase-js";

/**
 * Reduce a date of birth to the canonical "DDMMYYYY" string used as the password.
 * Day first. Returns null if it isn't a real date. Keep in sync with lib/dob.ts.
 */
export function normalizeDob(input) {
  const s = String(input ?? "").trim();
  let d, m, y;
  const spaced = s.match(/^(\d{1,2})[\/\-.\s](\d{1,2})[\/\-.\s](\d{4})$/);
  const compact = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (spaced) [d, m, y] = [Number(spaced[1]), Number(spaced[2]), Number(spaced[3])];
  else if (compact) [d, m, y] = [Number(compact[1]), Number(compact[2]), Number(compact[3])];
  else return null;

  if (y < 1900 || y > new Date().getFullYear()) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return String(d).padStart(2, "0") + String(m).padStart(2, "0") + String(y);
}

/** Canonical DOB from an Excel cell value: a real date, a text date, or a stray number. */
export function dobFromCellValue(v) {
  if (v == null || v === "") return { dob: null, shown: "" };
  if (v instanceof Date) {
    // ExcelJS gives date cells as UTC midnight, so read the UTC parts to avoid timezone shifts.
    const d = String(v.getUTCDate()).padStart(2, "0");
    const m = String(v.getUTCMonth() + 1).padStart(2, "0");
    return { dob: normalizeDob(`${d}/${m}/${v.getUTCFullYear()}`), shown: `${d}/${m}/${v.getUTCFullYear()}` };
  }
  if (typeof v === "number") {
    // 8-digit date typed as a number that lost its leading zero (5031990 -> 05031990)...
    const padded = String(v).padStart(8, "0");
    if (/^\d{8}$/.test(padded) && normalizeDob(padded)) return { dob: normalizeDob(padded), shown: String(v) };
    // ...otherwise treat as an Excel date serial number.
    if (v > 1 && v < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
      return dobFromCellValue(d);
    }
    return { dob: null, shown: String(v) };
  }
  const text = typeof v === "object" ? String(v.text ?? v.result ?? "") : String(v);
  return { dob: normalizeDob(text), shown: text.trim() };
}

export function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Create .env.local from .env.example first.");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
