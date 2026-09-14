"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { completedMonths, formatAge } from "@/lib/age";
import { Avatar, Badge, Card } from "@/components/ui";

interface ChildRow {
  id: string;
  name: string;
  dob: string;
  gender: string;
  created_at: string;
  assessments: { id: string; assessed_on: string; completed_at: string | null }[];
  profiles: {
    full_name: string;
    email: string;
    leads: { id: string } | null;
  } | null;
}

type StatusFilter = "all" | "completed" | "in_progress" | "none";

const STATUS_FILTERS: [StatusFilter, string][] = [
  ["all", "All"],
  ["completed", "Completed"],
  ["in_progress", "In Progress"],
  ["none", "No Assessments"],
];

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<ChildRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("children")
      .select(
        "id, name, dob, gender, created_at, assessments(id, assessed_on, completed_at), profiles:profile_id(full_name, email, leads(id))",
      )
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setChildren((data as any) ?? []);
      });
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const rows = useMemo(
    () =>
      (children ?? []).map((c) => {
        const completed = c.assessments.filter((a) => a.completed_at).length;
        const inProgress = c.assessments.filter((a) => !a.completed_at).length;
        const lastAssessment = [...c.assessments].sort((a, b) => b.assessed_on.localeCompare(a.assessed_on))[0];
        return {
          child: c,
          ageMonths: completedMonths(c.dob, today),
          completed,
          inProgress,
          lastAssessment,
          leadId: c.profiles?.leads?.id,
        };
      }),
    [children, today],
  );

  const filtered = rows.filter(({ child: c, completed, inProgress }) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.name?.toLowerCase().includes(q) ||
      (c.profiles?.full_name ?? "").toLowerCase().includes(q) ||
      (c.profiles?.email ?? "").toLowerCase().includes(q);
    const matchesStatus =
      status === "all" ||
      (status === "completed" && completed > 0) ||
      (status === "in_progress" && inProgress > 0) ||
      (status === "none" && c.assessments.length === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="!text-2xl">Children</h1>
          <p className="mt-1 text-sm text-ink-3">
            {children === null
              ? "Loading…"
              : `${children.length} child${children.length !== 1 ? "ren" : ""} registered`}
          </p>
        </div>
        <input
          className="field w-full max-w-xs"
          placeholder="Search child or parent name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className="chip cursor-pointer"
            style={
              status === value
                ? ({ "--chip-bg": "var(--accent)", "--chip-fg": "var(--on-accent)", "--chip-bd": "transparent" } as React.CSSProperties)
                : ({ "--chip-bg": "var(--surface-2)", "--chip-fg": "var(--ink-2)", "--chip-bd": "transparent" } as React.CSSProperties)
            }
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <Card className="!p-4 border-[var(--st-consult)]">
          <p className="text-sm text-[var(--st-consult-ink)]">⚠ {error}</p>
        </Card>
      )}

      {children === null && !error && (
        <p className="text-sm text-ink-3">Loading…</p>
      )}

      {filtered.length === 0 && children !== null && (
        <Card className="!p-8 text-center">
          <p className="text-sm text-ink-3">
            {search || status !== "all" ? "No children match your search or filter." : "No children registered yet."}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(({ child: c, ageMonths, completed, inProgress, lastAssessment, leadId }) => (
          <Card key={c.id} className="flex flex-col gap-4 !p-5">
            <div className="flex items-center gap-3">
              <Avatar name={c.name} size={48} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-bold text-ink">{c.name}</p>
                  <span className="shrink-0 rounded px-1.5 py-0.5 text-2xs capitalize text-ink-3 bg-surface-2">
                    {c.gender}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-3">{formatAge(ageMonths)}</p>
              </div>
            </div>

            <dl className="space-y-2 border-t border-line-soft pt-3.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-2xs font-bold uppercase tracking-wide text-ink-3">Date of Birth</dt>
                <dd className="font-medium text-ink">
                  {new Date(c.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-2xs font-bold uppercase tracking-wide text-ink-3">Parent</dt>
                <dd className="min-w-0 truncate text-right font-semibold">
                  {leadId ? (
                    <Link href={`/admin/leads/${leadId}`} className="text-accent hover:underline">
                      {c.profiles?.full_name || c.profiles?.email || "—"}
                    </Link>
                  ) : (
                    <span className="text-ink">{c.profiles?.full_name || c.profiles?.email || "—"}</span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-2 border-t border-line-soft pt-3.5">
              {completed > 0 && <Badge tone="success">{completed} completed</Badge>}
              {inProgress > 0 && <Badge tone="warn">{inProgress} in progress</Badge>}
              {c.assessments.length === 0 && <Badge tone="neutral">No assessments</Badge>}
            </div>

            {lastAssessment && (
              <p className="text-xs text-ink-3">
                Last: {lastAssessment.assessed_on}
                {lastAssessment.completed_at && (
                  <a
                    href={`/admin/report/${lastAssessment.id}`}
                    className="ml-2 font-semibold text-accent hover:underline"
                  >
                    View Report →
                  </a>
                )}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
