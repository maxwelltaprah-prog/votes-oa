// Generates employees-template.xlsx: the Excel template to fill in with your employee list.
import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet("Employees");

ws.columns = [
  { header: "Name", key: "name", width: 32 },
  { header: "Email", key: "email", width: 38 },
  { header: "Telephone", key: "phone", width: 20 },
];

ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F6F50" } };
ws.views = [{ state: "frozen", ySplit: 1 }];

// Telephone as text so Excel keeps the leading zero.
ws.getColumn("phone").numFmt = "@";

ws.addRow({ name: "Ada Okafor", email: "ada.okafor@example.com", phone: "08031234567" });
ws.addRow({ name: "Tunde Bello", email: "tunde.bello@example.com", phone: "08029876543" });

const notes = wb.addWorksheet("Instructions");
notes.getColumn(1).width = 90;
[
  "1. Fill the Employees sheet: one row per employee. Keep the three column headings exactly as they are.",
  "2. Email must be unique. It is the login username.",
  "3. Telephone is the login password. Format it as Text so the leading 0 is kept (spaces, dashes and +234 are handled).",
  "4. Delete the two example rows, save, then run:  npm run import -- path/to/your-file.xlsx",
  "5. Re-running the import updates existing employees (matched by email) and adds new ones.",
].forEach((t) => notes.addRow([t]));

await wb.xlsx.writeFile("employees-template.xlsx");
console.log("Wrote employees-template.xlsx");
