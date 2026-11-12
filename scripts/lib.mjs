import { createClient } from "@supabase/supabase-js";

/** Keep in sync with lib/phone.ts */
export function normalizePhone(input) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) digits = "0" + digits.slice(3);
  return digits;
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
