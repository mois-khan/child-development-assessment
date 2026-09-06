"use client";

import { useEffect, useState } from "react";
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
  profiles: { full_name: string; email: string } | null;
}

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<ChildRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("children")
      .select("id, name, dob, gender, created_at, assessments(id, assessed_on, completed_at), profiles:profile_id(full_name, email)")
      .order("created_at", { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setChildren((data as any) ?? []);
      });
  }, []);

  const filtered = children?.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name?.toLowerCase().includes(q) ||
      (c.profiles?.full_name ?? "").toLowerCase().includes(q) ||
      (c.profiles?.email ?? "").toLowerCase().includes(q)
    );
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="!text-[1.6rem]">Children</h1>
          <p className="mt-1 text-[0.88rem] text-ink-3">
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

      {error && (
        <Card className="!p-4 border-[var(--st-consult)]">
          <p className="text-[0.88rem] text-[var(--st-consult-ink)]">⚠ {error}</p>
        </Card>
      )}

      {children === null && !error && (
        <p className="text-[0.9rem] text-ink-3">Loading…</p>
      )}

      {filtered !== undefined && filtered.length === 0 && (
        <Card className="!p-8 text-center">
          <p className="text-[0.92rem] text-ink-3">
            {search ? "No children match your search." : "No children registered yet."}
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {filtered?.map((c) => {
          const ageMonths = completedMonths(c.dob, today);
          const completed = c.assessments.filter((a) => a.completed_at).length;
          const inProgress = c.assessments.filter((a) => !a.completed_at).length;
          const lastAssessment = c.assessments[0];

          return (
            <Card key={c.id} className="!p-5">
              <div className="flex flex-wrap items-start gap-4">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-ink">{c.name}</p>
                    <span className="text-[0.75rem] text-ink-3 bg-surface-2 rounded px-1.5 py-0.5 capitalize">
                      {c.gender}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.82rem] text-ink-3">
                    {formatAge(ageMonths)} · Born {c.dob}
                  </p>
                  <p className="mt-0.5 text-[0.78rem] text-ink-3">
                    Parent: <span className="font-semibold text-ink-2">{c.profiles?.full_name || c.profiles?.email || "—"}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-2">
                    {completed > 0 && (
                      <Badge tone="success">{completed} completed</Badge>
                    )}
                    {inProgress > 0 && (
                      <Badge tone="warn">{inProgress} in progress</Badge>
                    )}
                    {c.assessments.length === 0 && (
                      <Badge tone="neutral">No assessments</Badge>
                    )}
                  </div>
                  {lastAssessment && (
                    <p className="text-[0.75rem] text-ink-3">
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
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
