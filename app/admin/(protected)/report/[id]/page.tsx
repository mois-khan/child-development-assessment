"use client";

import { use } from "react";
import Link from "next/link";
import { ReportDocument } from "@/components/ReportDocument";
import { IconArrowLeft } from "@/components/ui";

export default function AdminReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink-3 hover:text-ink"
      >
        <IconArrowLeft size={16} /> Back to Leads
      </Link>

      <ReportDocument id={id} isAdmin={true} />
    </div>
  );
}
