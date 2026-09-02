"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DOMAIN_BY_CODE } from "@/content/domains";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { scoreAssessment } from "@/lib/scoring";
import {
  assessmentsForChild,
  getChild,
  latestAssessmentForChild,
  type SavedChild,
  type StoredAssessment,
} from "@/lib/store";
import type { AssessmentResult } from "@/lib/types";
import { Avatar, Shell, StatusChip, TopBar } from "@/components/ui";

export default function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [child, setChild] = useState<SavedChild | null | undefined>(undefined);
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);

  useEffect(() => {
    setChild(getChild(id));
    setAssessments(assessmentsForChild(id));
  }, [id]);

  const latest = useMemo(
    () => (child ? latestAssessmentForChild(child.id) : null),
    [child, assessments],
  );

  const latestResult = useMemo<AssessmentResult | null>(() => {
    if (!latest || !latest.completedAt) return null;
    return scoreAssessment({
      child: latest.child,
      assessedOn: latest.assessedOn,
      responses: latest.responses,
      bandsByDomain: latest.bandsByDomain,
    });
  }, [latest]);

  if (child === undefined) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center text-[0.9rem] text-ink-3">Loading…</p>
        </Shell>
      </>
    );
  }

  if (child === null) {
    return (
      <>
        <TopBar />
        <Shell>
          <div className="pt-20">
            <h1>We couldn&rsquo;t find that child</h1>
            <p className="prose-read mt-3 max-w-[46ch]">
              Profiles are saved in this browser only, so a link from another device won&rsquo;t open here.
            </p>
            <Link href="/children" className="btn btn-primary mt-7">
              Go to your children
            </Link>
          </div>
        </Shell>
      </>
    );
  }

  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);

  return (
    <>
      <TopBar
        right={
          <Link href="/children" className="btn btn-quiet btn-sm">
            All children
          </Link>
        }
      />

      <main className="pb-24">
        <Shell width="wide">
          {/* ── profile card ──────────────────────────────────────────── */}
          <div className="card card-pastel-blue animate-rise mt-8 flex flex-wrap items-center justify-between gap-5 !p-6">
            <div className="flex items-center gap-4">
              {child.photoUrl ? (
                <img
                  src={child.photoUrl}
                  alt={child.name}
                  className="size-[62px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <Avatar name={child.name} size={62} />
              )}
              <div>
                <h1 className="text-[1.5rem]">{child.name}</h1>
                <p className="mt-1 text-[0.9rem] font-medium text-ink-2">
                  {formatAge(age.chronologicalMonths)} old ·{" "}
                  {child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—"} · Born{" "}
                  {formatDate(child.dob)}
                </p>
              </div>
            </div>
            <Link href={`/children/${child.id}/assessments`} className="btn btn-primary">
              Start an assessment
            </Link>
          </div>

          {/* ── latest report, always here ───────────────────────────── */}
          <section className="mt-10">
            <h2>Latest report</h2>
            {!latest || !latestResult ? (
              <div className="card mt-4 p-6 text-center">
                <p className="text-[0.92rem] text-ink-2">
                  No completed assessment yet. Once {child.name} finishes one, the report will always be
                  right here.
                </p>
              </div>
            ) : (
              <div className="card card-raised mt-4 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div className="flex items-center gap-3">
                    <StatusChip status={latestResult.overallStatus} solid />
                    <span className="text-[0.83rem] text-ink-3">
                      Assessed {formatDate(latest.assessedOn)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/report/${latest.id}`} className="btn btn-ghost btn-sm">
                      View full report
                    </Link>
                    <Link href={`/report/${latest.id}?download=1`} className="btn btn-primary btn-sm">
                      Download
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-line-soft p-5 sm:grid-cols-2">
                  {latestResult.domainScores.map((s) => {
                    const value = s.dq === null ? s.percent * 100 : s.dq;
                    return (
                      <div key={s.domain}>
                        <div className="flex items-baseline justify-between text-[0.8rem]">
                          <span className="font-semibold text-ink-2">
                            {DOMAIN_BY_CODE[s.domain].short}
                          </span>
                          <span className="tabular-nums text-ink-3">{Math.round(value)}</span>
                        </div>
                        <div className="meter-track mt-1.5">
                          <div
                            className="meter-fill"
                            style={{
                              width: `${Math.min(100, value)}%`,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* ── all assessments ──────────────────────────────────────── */}
          {assessments.length > 0 && (
            <section className="mt-10">
              <h2>All assessments</h2>
              <ul className="mt-4 list-none space-y-2.5 p-0">
                {assessments.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={a.completedAt ? `/report/${a.id}` : `/assessment/${a.id}`}
                      className="card flex items-center justify-between gap-3 p-4 transition-colors hover:border-[var(--accent)]"
                    >
                      <div>
                        <p className="text-[0.92rem] font-semibold text-ink">
                          Genius Milestones Check
                        </p>
                        <p className="mt-0.5 text-[0.78rem] text-ink-3">
                          {formatDate(a.assessedOn)}
                        </p>
                      </div>
                      <span className="chip">
                        {a.completedAt ? "Completed" : "In progress"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </Shell>
      </main>
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
