// Usage: npm run create-admin -- admin@company.com 'a-strong-password'
// Creates the admin, or resets the password if that email already exists.
import bcrypt from "bcryptjs";
import { supabase } from "./lib.mjs";

const [emailArg, password] = process.argv.slice(2);
const email = (emailArg || "").trim().toLowerCase();

if (!email || !password) {
  console.error("Usage: npm run create-admin -- admin@company.com 'a-strong-password'");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Use a password of at least 10 characters.");
  process.exit(1);
}

const password_hash = await bcrypt.hash(password, 12);
const { error } = await supabase().from("admins").upsert({ email, password_hash }, { onConflict: "email" });
if (error) {
  console.error("Failed:", error.message);
  process.exit(1);
}
console.log(`Admin ready: ${email}`);
