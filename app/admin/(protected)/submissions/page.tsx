"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminListSubmissions, type AdminSubmission } from "@/lib/admin/data";
import { STATUSES } from "@/lib/scoring";
import { formatAge, summariseAge } from "@/lib/age";
import { Avatar, Badge, Card, StatusChip } from "@/components/ui";

type Filter = "all" | "complete" | "in_progress" | "consult";
const FILTER_VALUES: Filter[] = ["all", "complete", "in_progress", "consult"];

export default function AdminSubmissionsPage() {
  const searchParams = useSearchParams();
  // The dashboard's "Worth a closer look" tile links here with ?filter=consult
  // — this is what turns that number into somewhere to actually land, rather
  // than a dead-end count the admin then has to re-filter for by hand.
  const initialFilter = searchParams.get("filter");
  const [submissions, setSubmissions] = useState<AdminSubmission[] | null>(null);
  const [filter, setFilter] = useState<Filter>(
    FILTER_VALUES.includes(initialFilter as Filter) ? (initialFilter as Filter) : "all",
  );
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminListSubmissions().then(setSubmissions);
  }, []);

  const filtered = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter((s) => {
      if (filter === "complete" && !s.assessment.completedAt) return false;
      if (filter === "in_progress" && s.assessment.completedAt) return false;
      if (filter === "consult" && s.result?.overallStatus !== "significant" && s.result?.overallStatus !== "delay") return false;
      if (query && !s.assessment.child.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [submissions, filter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="!text-[1.6rem]">Submissions</h1>
        <p className="mt-1.5 text-[0.9rem] text-ink-3">
          Every assessment started or completed through the parent-facing check.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="field !w-auto min-w-[16rem]"
          placeholder="Search by child's name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["complete", "Complete"],
              ["in_progress", "In progress"],
              ["consult", "Worth a closer look"],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className="chip cursor-pointer"
              style={
                filter === value
                  ? ({ "--chip-bg": "var(--accent)", "--chip-fg": "var(--on-accent)", "--chip-bd": "transparent" } as React.CSSProperties)
                  : ({ "--chip-bg": "var(--surface-2)", "--chip-fg": "var(--ink-2)", "--chip-bd": "transparent" } as React.CSSProperties)
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!submissions ? (
        <p className="text-[0.9rem] text-ink-3">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            {submissions.length === 0
              ? "No submissions yet. Complete the parent-facing check in another tab to see one here."
              : "Nothing matches that search or filter."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="divide-y divide-line">
            {filtered.map(({ assessment, result }) => (
              <Link
                key={assessment.id}
                href={`/admin/submissions/${assessment.id}`}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <Avatar name={assessment.child.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.94rem] font-bold text-ink">
                    {assessment.child.name}
                  </p>
                  <p className="text-[0.78rem] text-ink-3">
                    {formatAge(
                      summariseAge(assessment.child.dob, assessment.assessedOn, assessment.child.gestationalWeeks)
                        .chronologicalMonths,
                    )}{" "}
                    old · Assessed {assessment.assessedOn}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  {!assessment.completedAt && <Badge tone="neutral">In progress</Badge>}
                  {result && !result.suppressDq && (
                    <StatusChip status={result.overallStatus} label={STATUSES[result.overallStatus].label} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
