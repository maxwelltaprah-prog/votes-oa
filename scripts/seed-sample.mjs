// Loads SAMPLE employees so you can test the portal before importing your real list.
// Usage: npm run seed
// Every sample employee logs in with their email + the date of birth listed below (DD/MM/YYYY).
import bcrypt from "bcryptjs";
import { normalizeDob, supabase } from "./lib.mjs";

const sample = [
  ["Ada Okafor", "ada.okafor@example.com", "05/03/1990"],
  ["Tunde Bello", "tunde.bello@example.com", "17/11/1985"],
  ["Chioma Eze", "chioma.eze@example.com", "22/07/1992"],
  ["Ibrahim Musa", "ibrahim.musa@example.com", "01/01/1988"],
  ["Ngozi Nwosu", "ngozi.nwosu@example.com", "30/09/1994"],
  ["Emeka Obi", "emeka.obi@example.com", "14/02/1987"],
  ["Fatima Abubakar", "fatima.abubakar@example.com", "09/12/1991"],
  ["Segun Adeyemi", "segun.adeyemi@example.com", "25/05/1983"],
  ["Blessing Udoh", "blessing.udoh@example.com", "18/08/1996"],
  ["Yusuf Danjuma", "yusuf.danjuma@example.com", "03/04/1989"],
  ["Amaka Onyeka", "amaka.onyeka@example.com", "27/10/1993"],
  ["Kunle Ajayi", "kunle.ajayi@example.com", "11/06/1986"],
];

const records = await Promise.all(
  sample.map(async ([name, email, dob]) => ({ name, email, dob_hash: await bcrypt.hash(normalizeDob(dob), 10) }))
);

const { error } = await supabase().from("employees").upsert(records, { onConflict: "email" });
if (error) {
  console.error("Seed failed:", error.message);
  console.error('Tip: if this mentions "dob_hash", run supabase/migrations/002_phone_to_dob.sql in the Supabase SQL Editor first.');
  process.exit(1);
}
console.log(`Seeded ${records.length} sample employees.`);
console.log("Test login, for example:  ada.okafor@example.com  /  05/03/1990");
