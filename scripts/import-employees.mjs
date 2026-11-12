// Usage: npm run import -- path/to/employees.xlsx
// Reads the "Employees" sheet (or the first sheet) with columns Name, Email, Telephone
// and upserts them into Supabase. Telephone numbers are stored only as bcrypt hashes.
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { normalizePhone, supabase } from "./lib.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run import -- path/to/employees.xlsx");
  process.exit(1);
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(file);
const ws = wb.getWorksheet("Employees") ?? wb.worksheets[0];

const text = (cell) => {
  const v = cell?.value;
  if (v == null) return "";
  if (typeof v === "object") return String(v.text ?? v.result ?? v.hyperlink ?? "").trim();
  return String(v).trim();
};

// Map headers (case-insensitive) so column order doesn't matter.
const headers = {};
ws.getRow(1).eachCell((cell, col) => {
  headers[text(cell).toLowerCase()] = col;
});
const col = (...names) => names.map((n) => headers[n]).find(Boolean);
const nameCol = col("name", "full name", "employee name");
const emailCol = col("email", "email address");
const phoneCol = col("telephone", "phone", "phone number", "mobile");
if (!nameCol || !emailCol || !phoneCol) {
  console.error("Could not find the Name, Email and Telephone columns in row 1.");
  process.exit(1);
}

const rows = [];
const problems = [];
const seen = new Set();

ws.eachRow((row, i) => {
  if (i === 1) return;
  const name = text(row.getCell(nameCol));
  const email = text(row.getCell(emailCol)).toLowerCase();
  const rawPhone = text(row.getCell(phoneCol));
  if (!name && !email && !rawPhone) return; // blank line

  // Excel often drops the leading zero from numbers stored as numbers. Restore it for 10-digit local numbers.
  let phone = normalizePhone(rawPhone);
  if (/^[789]\d{9}$/.test(phone)) phone = "0" + phone;

  if (!name || !email || !phone) return problems.push(`Row ${i}: missing name, email or telephone`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return problems.push(`Row ${i}: invalid email "${email}"`);
  if (seen.has(email)) return problems.push(`Row ${i}: duplicate email "${email}"`);
  seen.add(email);
  rows.push({ name, email, phone });
});

if (problems.length) {
  console.error(`Fix these ${problems.length} problem(s) and run again:\n - ` + problems.join("\n - "));
  process.exit(1);
}
if (rows.length === 0) {
  console.error("No employee rows found.");
  process.exit(1);
}

const records = await Promise.all(
  rows.map(async (r) => ({ name: r.name, email: r.email, phone_hash: await bcrypt.hash(r.phone, 10) }))
);

const db = supabase();
const BATCH = 500;
for (let i = 0; i < records.length; i += BATCH) {
  const { error } = await db.from("employees").upsert(records.slice(i, i + BATCH), { onConflict: "email" });
  if (error) {
    console.error("Import failed:", error.message);
    console.error("Tip: if this mentions a constraint on email, make sure supabase/schema.sql has been run.");
    process.exit(1);
  }
}
console.log(`Imported ${records.length} employees.`);
