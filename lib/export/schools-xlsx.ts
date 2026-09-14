import ExcelJS from "exceljs";
import { getSchoolDetail, type AdminSchool, type AdminSchoolDetail } from "@/lib/data/schools";

/* ── shared formatting ──────────────────────────────────────────────────────
 * One header style and one column layout, reused by both the single-school
 * and the all-schools workbook so a school's sheet looks identical whichever
 * button produced it. */

const STUDENT_COLUMNS: Partial<ExcelJS.Column>[] = [
  { header: "Student Name", key: "name", width: 24 },
  { header: "Date of Birth", key: "dob", width: 14 },
  { header: "Gender", key: "gender", width: 10 },
  { header: "Guardian Name", key: "guardianName", width: 22 },
  { header: "Guardian Phone", key: "guardianPhone", width: 16 },
  { header: "Guardian Email", key: "guardianEmail", width: 26 },
  { header: "Completed Assessments", key: "completed", width: 20 },
  { header: "In Progress", key: "inProgress", width: 12 },
  { header: "Last Assessed On", key: "lastAssessedOn", width: 16 },
];

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.alignment = { vertical: "middle" };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4D1435" } };
  });
  header.height = 20;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: `${String.fromCharCode(64 + STUDENT_COLUMNS.length)}1` };
}

function addStudentRows(sheet: ExcelJS.Worksheet, school: AdminSchoolDetail) {
  sheet.columns = STUDENT_COLUMNS;
  for (const s of school.students) {
    sheet.addRow({
      name: s.name,
      dob: s.dob,
      gender: s.gender,
      guardianName: s.guardianName || "—",
      guardianPhone: s.guardianPhone || "—",
      guardianEmail: s.guardianEmail || "—",
      completed: s.completedCount,
      inProgress: s.inProgressCount,
      lastAssessedOn: s.lastAssessedOn || "—",
    });
  }
  styleHeaderRow(sheet);
}

/** Excel sheet names: max 31 chars, and a handful of characters are illegal. */
function sheetName(raw: string, usedNames: Set<string>): string {
  let base = (raw || "School").replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 28) || "School";
  let name = base;
  let n = 2;
  while (usedNames.has(name.toLowerCase())) {
    name = `${base} (${n})`.slice(0, 31);
    n += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

function triggerDownload(buffer: ExcelJS.Buffer, filename: string) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** One school's roster as its own .xlsx — the "download for this school" button. */
export async function exportSchoolRoster(school: AdminSchoolDetail): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kaushalya Developmental Screening Platform";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName(school.schoolName, new Set()));
  addStudentRows(sheet, school);

  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = school.schoolName.replace(/[^\w\- ]/g, "").trim() || "School";
  triggerDownload(buffer, `${safeName} - roster.xlsx`);
}

/**
 * Every school's roster in one workbook — a "Summary" sheet listing every
 * school, then one sheet per school with its full student list. Fetches the
 * full roster per school (listSchools() deliberately skips it, see
 * lib/data/schools.ts), so this can take a moment on a large account list.
 */
export async function exportAllSchools(schools: AdminSchool[]): Promise<void> {
  const details = await Promise.all(schools.map((s) => getSchoolDetail(s.id)));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Kaushalya Developmental Screening Platform";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "School Name", key: "name", width: 26 },
    { header: "City", key: "city", width: 16 },
    { header: "Contact Person", key: "contact", width: 22 },
    { header: "Contact Phone", key: "phone", width: 16 },
    { header: "Login Email", key: "email", width: 28 },
    { header: "Students", key: "count", width: 12 },
  ];
  for (const s of schools) {
    summary.addRow({
      name: s.schoolName,
      city: s.city || "—",
      contact: s.contactName || "—",
      phone: s.contactPhone || "—",
      email: s.email,
      count: s.studentCount,
    });
  }
  const header = summary.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4D1435" } };
  });
  header.height = 20;
  summary.views = [{ state: "frozen", ySplit: 1 }];
  summary.autoFilter = { from: "A1", to: "F1" };

  const usedNames = new Set<string>(["summary"]);
  for (const school of details) {
    if (!school) continue;
    const sheet = workbook.addWorksheet(sheetName(school.schoolName, usedNames));
    addStudentRows(sheet, school);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const today = new Date().toISOString().slice(0, 10);
  triggerDownload(buffer, `All schools - rosters - ${today}.xlsx`);
}
