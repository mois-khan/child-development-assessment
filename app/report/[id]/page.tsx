"use client";

import { use } from "react";
import { ReportDocument } from "@/components/ReportDocument";

/**
 * Thin wrapper — the parent-facing report was previously a ~1000-line
 * standalone copy of ReportDocument.tsx that had to be hand-kept in sync
 * with it (see the admin report route, which already used the shared
 * component). Same content, one source of truth.
 */
export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <ReportDocument id={id} isAdmin={false} />;
}
