"use client";

import { use, useEffect, useState } from "react";
import { ReportDocument } from "@/components/ReportDocument";
import type { StoredAssessment } from "@/lib/store";
import { Button, TopBar, Wordmark } from "@/components/ui";

export default function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<StoredAssessment | null>(null);
  const [reportPdfUrl, setReportPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/share/${token}`)
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Report not found or not available.");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setAssessment(data.assessment);
        setReportPdfUrl(data.reportPdfUrl);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Failed to load report.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="size-10 animate-spin rounded-full border-4 border-[#4D1435] border-t-transparent" />
        <p className="mt-4 text-sm font-semibold text-gray-500">Loading developmental report…</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <Wordmark height={40} className="mx-auto h-9 w-auto" />
          <h1 className="mt-5 text-xl font-bold text-gray-900">Report Not Available</h1>
          <p className="mt-2 text-sm text-gray-600">
            {error || "This developmental report link may be incomplete or invalid. Please request a new share link from the parent or school."}
          </p>
        </div>
      </div>
    );
  }

  // If immutable snapshot in R2 exists:
  if (reportPdfUrl) {
    return (
      <main className="flex min-h-screen flex-col bg-gray-100">
        <header className="no-print flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Wordmark height={32} className="h-7 w-auto" />
            <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              Shared Pediatric Access
            </span>
          </div>
          <a
            href={reportPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 rounded-full bg-[#4D1435] px-5 py-2 text-sm font-bold text-white shadow transition-colors hover:bg-[#3a0f28]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
        </header>

        <div className="flex flex-1 flex-col items-center p-4">
          <div className="w-full max-w-[850px] flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
            <iframe
              src={`${reportPdfUrl}#toolbar=1&view=FitH`}
              title={`${assessment.child.name}'s Assessment Report`}
              className="h-[calc(100vh-120px)] min-h-[650px] w-full border-none"
            />
          </div>
        </div>
      </main>
    );
  }

  // Dynamic live report render with shared banner
  return (
    <div>
      <div className="no-print flex items-center justify-between border-b border-gray-200 bg-white px-6 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          <Wordmark height={30} className="h-6 w-auto" />
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            Pediatrician &amp; Family Access
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Viewing: <strong className="text-gray-800">{assessment.child.name}&rsquo;s Report</strong>
        </p>
      </div>
      <ReportDocument id={assessment.id} initialAssessment={assessment} isAdmin={false} />
    </div>
  );
}
