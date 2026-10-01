"use client";

import { use, useState, useEffect } from "react";
import { ReportDocument } from "@/components/ReportDocument";
import { getAssessment } from "@/lib/store";
import { resolveReportView } from "@/lib/storage/resolve-report";
import { TopBar } from "@/components/ui";

/**
 * Report page — serves the immutable frozen PDF snapshot when available,
 * falls back to dynamic rendering for legacy or in-progress assessments.
 *
 * Decision logic (see lib/storage/report-storage.ts::resolveReportView):
 *   frozen  → assessments.report_pdf_url is set  → render the stored PDF
 *   dynamic → report_pdf_url is NULL             → render <ReportDocument />
 */
export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [view, setView] = useState<
    | { mode: "loading" }
    | { mode: "frozen"; url: string }
    | { mode: "dynamic" }
    | { mode: "error"; message: string }
  >({ mode: "loading" });

  useEffect(() => {
    let active = true;
    getAssessment(id)
      .then((assessment) => {
        if (!active) return;
        if (!assessment) {
          setView({ mode: "error", message: "Assessment not found." });
          return;
        }
        const resolved = resolveReportView(assessment.reportPdfUrl);
        setView(resolved);
      })
      .catch((err) => {
        if (active) setView({ mode: "error", message: err?.message || "Failed to load." });
      });
    return () => {
      active = false;
    };
  }, [id]);

  // ── Frozen: serve the immutable PDF snapshot ───────────────────────────────
  if (view.mode === "frozen") {
    return (
      <>
        <TopBar />
        <main className="flex flex-col min-h-screen bg-gray-100">
          {/* Download button */}
          <div className="no-print flex justify-end px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
            <a
              href={view.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#4D1435] text-white font-bold text-sm shadow hover:bg-[#3a0f28] transition-colors"
            >
              {/* Download icon (inline SVG, no raster) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </a>
          </div>

          {/* Frozen PDF iframe */}
          <div className="flex-1 flex flex-col items-center py-4 px-4">
            <div className="w-full max-w-[850px] flex-1 rounded-lg overflow-hidden shadow-xl border border-gray-200 bg-white">
              <iframe
                src={`${view.url}#toolbar=1&view=FitH`}
                title="Assessment Report"
                className="w-full h-[calc(100vh-120px)] min-h-[600px]"
                style={{ border: "none" }}
              />
            </div>
            <p className="mt-3 text-xs text-gray-400 text-center">
              This report is an immutable snapshot generated at assessment completion.
            </p>
          </div>
        </main>
      </>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (view.mode === "error") {
    return (
      <>
        <TopBar />
        <div className="p-8 text-red-500">{view.message}</div>
      </>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (view.mode === "loading") {
    return (
      <>
        <TopBar />
        <div className="p-8 text-gray-500">Loading…</div>
      </>
    );
  }

  // ── Dynamic: fall back to live render ─────────────────────────────────────
  // (view.mode === "dynamic")
  return <ReportDocument id={id} isAdmin={false} />;
}
