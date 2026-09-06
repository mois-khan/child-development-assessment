"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Avatar, Badge, Card } from "@/components/ui";

type Filter = "all" | "completed" | "in_progress";

interface AssessmentRow {
  id: string;
  assessed_on: string;
  completed_at: string | null;
  created_at: string;
  children: {
    name: string;
    dob: string;
    profiles: { full_name: string; email: string } | null;
  } | null;
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("assessments")
      .select("id, assessed_on, completed_at, created_at, children(name, dob, profiles:profile_id(full_name, email))")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setAssessments((data as any) ?? []);
      });
  }, []);

  const filtered = assessments?.filter((a) => {
    if (filter === "completed") return !!a.completed_at;
    if (filter === "in_progress") return !a.completed_at;
    return true;
  });

  const completedCount = assessments?.filter((a) => a.completed_at).length ?? 0;
  const inProgressCount = assessments?.filter((a) => !a.completed_at).length ?? 0;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${assessments?.length ?? "…"})` },
    { key: "completed", label: `Completed (${completedCount})` },
    { key: "in_progress", label: `In Progress (${inProgressCount})` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="!text-2xl">Assessments</h1>
        <p className="mt-1 text-sm text-ink-3">
          All assessments across the programme.
        </p>
      </div>

      {error && (
        <Card className="!p-4 border-[var(--st-consult)]">
          <p className="text-sm text-[var(--st-consult-ink)]">⚠ {error}</p>
        </Card>
      )}

      {/* ── filter tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
              filter === key
                ? "bg-[var(--accent)] text-white shadow-md"
                : "bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {assessments === null && !error && (
        <p className="text-sm text-ink-3">Loading…</p>
      )}

      {filtered !== undefined && filtered.length === 0 && (
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">No assessments found.</p>
        </Card>
      )}

      <div className="space-y-3">
        {filtered?.map((a) => {
          const child = Array.isArray(a.children) ? a.children[0] : a.children;
          const profiles = child && !Array.isArray(child.profiles) ? child.profiles : null;

          return (
            <Card key={a.id} className="!p-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={child?.name ?? "?"} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{child?.name ?? "Unknown child"}</p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    Parent: {profiles?.full_name || profiles?.email || "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-3">
                    Assessed on {a.assessed_on}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {a.completed_at ? (
                    <>
                      <Badge tone="success">Completed</Badge>
                      <Link
                        href={`/admin/report/${a.id}`}
                        className="text-sm font-semibold text-accent hover:underline"
                      >
                        View Report →
                      </Link>
                    </>
                  ) : (
                    <Badge tone="warn">In Progress</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
