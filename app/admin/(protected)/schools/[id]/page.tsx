"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getSchoolDetail, type AdminSchoolDetail } from "@/lib/data/schools";
import { completedMonths, formatAge } from "@/lib/age";
import { Avatar, Badge, Card, IconChevronRight, InlineBanner, useBanner } from "@/components/ui";

export default function SchoolDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const banner = useBanner();

  const [school, setSchool] = useState<AdminSchoolDetail | null | undefined>(undefined);

  useEffect(() => {
    getSchoolDetail(params.id)
      .then(setSchool)
      .catch((err: any) => banner.showError("Failed to load school: " + err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const today = new Date().toISOString().slice(0, 10);

  if (school === undefined) {
    return <p className="text-ink-3">Loading…</p>;
  }

  if (school === null) {
    return (
      <Card className="!p-8 text-center">
        <p className="text-ink-3">School not found.</p>
        <button onClick={() => router.push("/admin/schools")} className="mt-3 font-semibold text-accent hover:underline">
          Back to Schools
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <InlineBanner message={banner.message} onDismiss={banner.clear} />

      <button
        onClick={() => router.push("/admin/schools")}
        className="flex items-center gap-1 text-sm font-semibold text-ink-3 hover:text-ink"
      >
        <IconChevronRight size={15} className="rotate-180" /> Schools
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">{school.schoolName}</h1>
          <p className="mt-1 text-sm text-ink-2">
            {school.contactName || "—"}
            {school.contactPhone && ` · ${school.contactPhone}`}
            {school.city && ` · ${school.city}`}
          </p>
          <p className="mt-0.5 font-mono text-xs text-ink-3">{school.email}</p>
        </div>
        <Badge tone={school.students.length > 0 ? "success" : "neutral"}>
          {school.students.length} {school.students.length === 1 ? "student" : "students"}
        </Badge>
      </div>

      {school.students.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">This school hasn&rsquo;t added any students yet.</p>
        </Card>
      ) : (
        <Card variant="clay" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line-soft bg-surface-2 text-ink-3">
                <tr>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Guardian</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-soft bg-surface">
                {school.students.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} size={36} />
                        <div>
                          <div className="font-semibold text-ink">{s.name}</div>
                          <div className="text-xs text-ink-3">
                            {formatAge(completedMonths(s.dob, today))} · {s.gender}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-ink-2">
                      {s.guardianName || "—"}
                      {(s.guardianPhone || s.guardianEmail) && (
                        <div className="text-xs text-ink-3">
                          {[s.guardianPhone, s.guardianEmail].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {s.completedCount > 0 && <Badge tone="success">{s.completedCount} completed</Badge>}
                      {s.inProgressCount > 0 && (
                        <Badge tone="warn" className={s.completedCount > 0 ? "ml-2" : undefined}>
                          {s.inProgressCount} in progress
                        </Badge>
                      )}
                      {s.completedCount === 0 && s.inProgressCount === 0 && (
                        <Badge tone="neutral">No assessments</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.lastAssessmentId && s.completedCount > 0 ? (
                        <Link
                          href={`/admin/report/${s.lastAssessmentId}`}
                          className="font-semibold text-accent hover:underline"
                        >
                          View Report →
                        </Link>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
