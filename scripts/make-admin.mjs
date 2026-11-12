// Usage: npm run make-admin -- someone@company.com        (add --remove to take admin rights away)
// Admins are employees, so the person must already be imported. They sign in with email + date of birth.
import { supabase } from "./lib.mjs";

const args = process.argv.slice(2);
const remove = args.includes("--remove");
const email = (args.find((a) => !a.startsWith("--")) || "").trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- someone@company.com [--remove]");
  process.exit(1);
}

const { data, error } = await supabase()
  .from("employees")
  .update({ is_admin: !remove })
  .eq("email", email)
  .select("name, email, is_admin");

if (error) {
  console.error("Failed:", error.message);
  console.error('Tip: if this mentions "is_admin", run supabase/migrations/003_employee_admins.sql first.');
  process.exit(1);
}
if (!data || data.length === 0) {
  console.error(`No employee with email ${email}. Import the employee list first.`);
  process.exit(1);
}
console.log(`${data[0].name} (${data[0].email}) is ${data[0].is_admin ? "now an admin" : "no longer an admin"}.`);
