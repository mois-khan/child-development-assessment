/**
 * lib/storage/resolve-report.ts
 *
 * Pure, client-safe helper to decide how to render a report.
 *
 * This module has ZERO server-side or Node.js imports — it is safe to
 * import in both Client Components and Server Components.
 *
 * The full orchestration pipeline (PDF generation → R2 upload → DB write)
 * lives in lib/storage/report-storage.ts which is server-only.
 */

/** Decision object consumed by the report page to choose render mode. */
export type ReportView =
  | { mode: "frozen"; url: string }
  | { mode: "dynamic" };

/**
 * Given the value of `report_pdf_url` from the database (may be null,
 * undefined, or empty string), decide how to render the report.
 *
 * frozen  → assessments.report_pdf_url is set  → embed the stored PDF
 * dynamic → report_pdf_url is NULL/empty        → render <ReportDocument />
 *
 * This is a pure function — no I/O, fully unit-testable.
 */
export function resolveReportView(reportPdfUrl: string | null | undefined): ReportView {
  if (reportPdfUrl && reportPdfUrl.trim().length > 0) {
    return { mode: "frozen", url: reportPdfUrl };
  }
  return { mode: "dynamic" };
}
