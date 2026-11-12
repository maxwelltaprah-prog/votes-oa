// Generates employees-template.xlsx: the Excel template to fill in with your employee list.
import ExcelJS from "exceljs";

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet("Employees");

ws.columns = [
  { header: "Full Name", key: "name", width: 32 },
  { header: "Date of Birth", key: "dob", width: 18 },
  { header: "Email ID", key: "email", width: 38 },
];

ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F6F50" } };
ws.views = [{ state: "frozen", ySplit: 1 }];

// Date of Birth as Text so Excel does not reinterpret DD/MM/YYYY using the computer's regional settings.
ws.getColumn("dob").numFmt = "@";

ws.addRow({ name: "Ada Okafor", dob: "05/03/1990", email: "ada.okafor@example.com" });
ws.addRow({ name: "Tunde Bello", dob: "17/11/1985", email: "tunde.bello@example.com" });

const notes = wb.addWorksheet("Instructions");
notes.getColumn(1).width = 100;
[
  "1. Fill the Employees sheet: one row per employee. Keep the three column headings: Full Name, Date of Birth, Email ID.",
  "2. Email ID must be unique. It is the login username.",
  "3. Date of Birth is the login password. Write it DD/MM/YYYY (day first), e.g. 05/03/1990 for 5 March 1990.",
  "4. The Date of Birth column is already formatted as Text. If you paste dates from elsewhere, keep that column as Text,",
  "   or use real Excel dates. Both are read correctly. Rows with a date that cannot be read are reported, not guessed.",
  "5. Delete the two example rows, save, then run:  npm run import -- path/to/your-file.xlsx",
  "6. Re-running the import updates existing employees (matched by email) and adds new ones.",
].forEach((t) => notes.addRow([t]));

await wb.xlsx.writeFile("employees-template.xlsx");
console.log("Wrote employees-template.xlsx");
