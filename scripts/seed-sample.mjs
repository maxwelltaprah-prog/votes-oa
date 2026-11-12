// Loads SAMPLE employees so you can test the portal before importing your real list.
// Usage: npm run seed
// Every sample employee logs in with their email + the telephone number listed below.
import bcrypt from "bcryptjs";
import { supabase } from "./lib.mjs";

const sample = [
  ["Ada Okafor", "ada.okafor@example.com", "08030000001"],
  ["Tunde Bello", "tunde.bello@example.com", "08030000002"],
  ["Chioma Eze", "chioma.eze@example.com", "08030000003"],
  ["Ibrahim Musa", "ibrahim.musa@example.com", "08030000004"],
  ["Ngozi Nwosu", "ngozi.nwosu@example.com", "08030000005"],
  ["Emeka Obi", "emeka.obi@example.com", "08030000006"],
  ["Fatima Abubakar", "fatima.abubakar@example.com", "08030000007"],
  ["Segun Adeyemi", "segun.adeyemi@example.com", "08030000008"],
  ["Blessing Udoh", "blessing.udoh@example.com", "08030000009"],
  ["Yusuf Danjuma", "yusuf.danjuma@example.com", "08030000010"],
  ["Amaka Onyeka", "amaka.onyeka@example.com", "08030000011"],
  ["Kunle Ajayi", "kunle.ajayi@example.com", "08030000012"],
];

const records = await Promise.all(
  sample.map(async ([name, email, phone]) => ({ name, email, phone_hash: await bcrypt.hash(phone, 10) }))
);

const { error } = await supabase().from("employees").upsert(records, { onConflict: "email" });
if (error) {
  console.error("Seed failed:", error.message);
  process.exit(1);
}
console.log(`Seeded ${records.length} sample employees.`);
console.log("Test login, for example:  ada.okafor@example.com  /  08030000001");
