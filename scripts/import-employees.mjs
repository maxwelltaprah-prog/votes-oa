// Usage: npm run import -- path/to/employees.xlsx
// Reads the "Employees" sheet (or the first sheet) with columns Full Name, Date of Birth, Email ID
// and upserts them into Supabase. Dates of birth are stored only as bcrypt hashes.
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";
import { dobFromCellValue, supabase } from "./lib.mjs";

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
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") return String(v.text ?? v.result ?? v.hyperlink ?? "").trim();
  return String(v).trim();
};

// Match headers ignoring case, spaces and punctuation, so "Full Name", "fullname" and "FULL_NAME" all work.
const simplify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
const headers = {};
ws.getRow(1).eachCell((cell, c) => {
  headers[simplify(text(cell))] = c;
});
const col = (...names) => names.map((n) => headers[n]).find(Boolean);
const nameCol = col("fullname", "name", "employeename");
const dobCol = col("dateofbirth", "dob", "birthdate", "birthday");
const emailCol = col("emailid", "email", "emailaddress");
if (!nameCol || !dobCol || !emailCol) {
  console.error("Could not find the Full Name, Date of Birth and Email ID columns in row 1.");
  process.exit(1);
}

const rows = [];
const problems = [];
const seen = new Set();

ws.eachRow((row, i) => {
  if (i === 1) return;
  const name = text(row.getCell(nameCol));
  const email = text(row.getCell(emailCol)).toLowerCase();
  const dobRaw = row.getCell(dobCol).value;
  const { dob, shown } = dobFromCellValue(dobRaw);
  if (!name && !email && !shown) return; // blank line

  if (!name || !email || !shown) return problems.push(`Row ${i}: missing full name, date of birth or email`);
  if (!dob) return problems.push(`Row ${i}: could not read date of birth "${shown}" (use DD/MM/YYYY)`);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return problems.push(`Row ${i}: invalid email "${email}"`);
  if (seen.has(email)) return problems.push(`Row ${i}: duplicate email "${email}"`);
  seen.add(email);
  rows.push({ name, email, dob });
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
  rows.map(async (r) => ({ name: r.name, email: r.email, dob_hash: await bcrypt.hash(r.dob, 10) }))
);

const db = supabase();
const BATCH = 500;
for (let i = 0; i < records.length; i += BATCH) {
  const { error } = await db.from("employees").upsert(records.slice(i, i + BATCH), { onConflict: "email" });
  if (error) {
    console.error("Import failed:", error.message);
    console.error('Tip: if this mentions "dob_hash", run supabase/migrations/002_phone_to_dob.sql in the Supabase SQL Editor first.');
    process.exit(1);
  }
}
console.log(`Imported ${records.length} employees.`);
