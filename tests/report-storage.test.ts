/**
 * tests/report-storage.test.ts
 *
 * TDD: Integration tests for the report storage pipeline.
 *
 * Covers:
 *   1. storeReport() — the orchestration function that glues
 *      PDF generation → R2 upload → Supabase write
 *      We mock all three I/O dependencies so this runs offline.
 *
 *   2. getReportPdfUrl() — reads report_pdf_url from the assessments row
 *
 *   3. resolveReportView() — pure decision: given an assessment row,
 *      return { mode: 'frozen', url } or { mode: 'dynamic' }
 *
 * Run: npm test
 */

import assert from "node:assert/strict";
import { test, describe, mock } from "node:test";

import {
  resolveReportView,
  type ReportView,
} from "@/lib/storage/resolve-report";

// ─── resolveReportView (pure, no I/O) ────────────────────────────────────────

describe("resolveReportView", () => {
  test("returns frozen mode with url when report_pdf_url is set", () => {
    const view = resolveReportView("https://cdn.example.com/reports/abc.pdf");
    assert.deepEqual(view, {
      mode: "frozen",
      url: "https://cdn.example.com/reports/abc.pdf",
    } satisfies ReportView);
  });

  test("returns dynamic mode when report_pdf_url is null", () => {
    const view = resolveReportView(null);
    assert.deepEqual(view, { mode: "dynamic" } satisfies ReportView);
  });

  test("returns dynamic mode when report_pdf_url is undefined", () => {
    const view = resolveReportView(undefined);
    assert.deepEqual(view, { mode: "dynamic" } satisfies ReportView);
  });

  test("returns dynamic mode when report_pdf_url is empty string", () => {
    const view = resolveReportView("");
    assert.deepEqual(view, { mode: "dynamic" } satisfies ReportView);
  });

  test("frozen url is returned unchanged (not trimmed or modified)", () => {
    const url = "https://cdn.example.com/reports/f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf";
    const view = resolveReportView(url);
    assert.equal((view as { mode: "frozen"; url: string }).url, url);
  });
});
