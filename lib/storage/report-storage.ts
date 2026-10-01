/**
 * lib/storage/report-storage.ts
 *
 * Server-only orchestration layer for report immutability.
 *
 * Responsibilities:
 *   1. Re-exports resolveReportView from lib/storage/resolve-report.ts
 *      (kept here for backward compatibility and as the single import point
 *       for server-side code that uses both resolveReportView and storeReportSnapshot)
 *   2. storeReportSnapshot() — side-effectful: generate PDF → upload R2 → save URL to DB
 *
 * ⚠️  This module MUST NOT be imported in Client Components — it pulls in
 *     Puppeteer (Node.js-only) via dynamic import. Use lib/storage/resolve-report.ts
 *     directly in Client Components.
 *
 * Call storeReportSnapshot() from the /api/notifications/report-ready route
 * immediately after assessment completion.
 *
 * The `report_pdf_url` in the `assessments` table is a write-once field:
 *   - NULL  → no snapshot yet (dynamic render is the fallback)
 *   - value → the canonical, immutable PDF URL — never overwrite
 */

// Re-export the pure, client-safe types and function
export type { ReportView } from "@/lib/storage/resolve-report";
export { resolveReportView } from "@/lib/storage/resolve-report";


// ─── Side-effectful: storeReportSnapshot ─────────────────────────────────────

/**
 * Full pipeline: generate PDF (via Puppeteer) → upload to R2 → persist URL.
 *
 * This is intentionally fire-and-forget friendly — the caller can await it
 * or skip awaiting; a failure here must NEVER fail the assessment completion.
 *
 * @param assessmentId  The UUID of the just-completed assessment
 * @param reportPageUrl The full URL of the /report/[id] page to render
 * @param cookies       Auth cookies to pass to Puppeteer for a protected page
 *
 * @returns The public R2 URL, or null if storage is not configured
 */
export async function storeReportSnapshot(
  assessmentId: string,
  reportPageUrl: string,
  cookies: Array<{ name: string; value: string; domain: string; path: string }>
): Promise<string | null> {
  // 1. Validate R2 config before doing expensive PDF generation
  const { getR2ConfigFromEnv, validateR2Config, uploadReportPdf } = await import(
    "@/lib/storage/r2"
  );
  const r2Config = getR2ConfigFromEnv();
  const configError = validateR2Config(r2Config);
  if (configError) {
    console.warn(`[report-storage] R2 not configured — skipping snapshot. ${configError}`);
    return null;
  }

  // 2. Generate the PDF via Puppeteer
  const { generateReportPdf } = await import("@/lib/pdf/generate");
  console.log(`[report-storage] Generating PDF for assessment ${assessmentId}…`);
  const pdfBuffer = await generateReportPdf(reportPageUrl, cookies as any);
  console.log(`[report-storage] PDF generated (${pdfBuffer.length} bytes).`);

  // 3. Upload to Cloudflare R2
  const { url } = await uploadReportPdf(assessmentId, pdfBuffer, r2Config);
  console.log(`[report-storage] Uploaded to R2: ${url}`);

  // 4. Persist the URL to Supabase — write-once: only update if still NULL
  //    We use the service-role client because:
  //      a) RLS on assessments blocks UPDATE for completed records from client
  //      b) This runs server-side in an API route
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("assessments")
    .update({ report_pdf_url: url })
    .eq("id", assessmentId)
    .is("report_pdf_url", null); // Write-once: only update if not already set

  if (error) {
    console.error(`[report-storage] Failed to persist report_pdf_url:`, error);
    throw new Error(`[report-storage] Supabase update failed: ${error.message}`);
  }

  console.log(`[report-storage] report_pdf_url persisted for assessment ${assessmentId}`);
  return url;
}
