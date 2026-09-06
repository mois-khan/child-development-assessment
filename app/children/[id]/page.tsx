"use client";

import { use, useEffect, useMemo, useState } from "react";
import { DOMAIN_BY_CODE, STAGE_JOURNEY } from "@/content/domains";
import { stageForAge } from "@/lib/stage";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { STATUSES, scoreAssessment } from "@/lib/scoring";
import {
  assessmentsForChild,
  getChild,
  type SavedChild,
  type StoredAssessment,
} from "@/lib/store";
import type { AssessmentResult } from "@/lib/types";
import {
  Avatar,
  Badge,
  BrainJourney,
  Button,
  ButtonLink,
  Card,
  Footer,
  IconArrowRight,
  IconCalendar,
  IconChart,
  IconDownload,
  IconRefresh,
  IconSparkle,
  IconStarFilled,
  Mascot,
  Meter,
  Section,
  SectionTile,
  Shell,
  StatusChip,
  TopBar,
  domainColor,
} from "@/components/ui";

export default function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [child, setChild] = useState<SavedChild | null | undefined>(undefined);
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getChild(id),
      assessmentsForChild(id)
    ]).then(([c, a]) => {
      if (!active) return;
      setChild(c);
      setAssessments(a);
    });
    return () => { active = false; };
  }, [id]);

  const latest = useMemo(
    () => assessments.find(a => a.completedAt) ?? assessments[0] ?? null,
    [assessments],
  );

  const result = useMemo<AssessmentResult | null>(() => {
    if (!latest?.completedAt) return null;
    return scoreAssessment({
      child: latest.child,
      assessedOn: latest.assessedOn,
      responses: latest.responses,
      details: latest.details,
      stagesByDomain: latest.stagesByDomain,
    });
  }, [latest]);

  if (child === undefined) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Loading…</p>
        </Shell>
      </>
    );
  }

  if (child === null) {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={92} mood="think" className="mx-auto" />
            <h1 className="mt-6">We couldn&rsquo;t find that child</h1>
            <p className="prose-read mx-auto mt-3 max-w-[40ch]">
              Profiles are saved in this browser only, so a link from another device
              won&rsquo;t open here.
            </p>
            <ButtonLink href="/children" className="mt-8">
              Go to your children
            </ButtonLink>
          </div>
        </Shell>
      </>
    );
  }

  const age = summariseAge(child.dob, todayISO(), child.gestationalWeeks);
  const stage = stageForAge(age.assessedMonths);
  const completed = assessments.filter((a) => a.completedAt).length;

  return (
    <>
      <TopBar
        right={
          <ButtonLink href={`/children/${child.id}/pay`} size="sm" iconRight={<IconArrowRight size={16} />}>
            New check
          </ButtonLink>
        }
      />

      <main className="pb-8">
        {/* ══ profile hero ═══════════════════════════════════════════════ */}
        <Shell width="wide">
          <div
            className="relative mt-7 overflow-hidden px-6 py-8 sm:px-10 sm:py-10"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(150deg, var(--brand-600), var(--brand-800))",
              boxShadow:
                "0 2px 5px rgba(69, 77, 93, 0.14), 0 40px 70px -28px color-mix(in srgb, var(--brand-600) 60%, transparent)",
            }}
          >
            <span
              aria-hidden="true"
              className="bloom"
              style={{ width: 300, height: 300, top: -140, right: "6%", "--bloom-color": "var(--sun-400)", opacity: 0.3 } as React.CSSProperties}
            />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar name={child.name} photoUrl={child.photoUrl} size={88} ring />
                <div>
                  <h1 className="text-white">{child.name}</h1>
                  <p className="mt-1.5 text-[0.95rem] font-semibold text-white/80">
                    Born {formatDate(child.dob)} ({age.chronologicalMonths} month{age.chronologicalMonths === 1 ? "" : "s"}) ·{" "}
                    {child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—"}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.82rem] font-bold text-white backdrop-blur">
                    <IconSparkle size={15} />
                    Stage {stage.roman} of VII · {stage.name}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="min-w-[100px] rounded-[var(--radius)] bg-white/12 px-4 py-3 text-center backdrop-blur">
                  <p
                    className="tnum text-[1.65rem] font-extrabold text-white"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {completed}
                  </p>
                  <p className="text-[0.74rem] font-bold text-white/70">
                    {completed === 1 ? "Report" : "Reports"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Shell>

        {/* ══ 1. assessments done (tabular format) ════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-accent">Tracked progress</p>
                <h2 className="mt-1">Assessments &amp; Reports</h2>
              </div>
              <ButtonLink
                href={`/children/${child.id}/pay`}
                size="sm"
                iconRight={<IconArrowRight size={16} />}
              >
                Start new check
              </ButtonLink>
            </div>

            {assessments.length === 0 ? (
              <Card variant="clay" className="mt-6 p-8 text-center sm:p-12">
                <Mascot size={88} mood="wave" className="mx-auto" />
                <h3 className="mt-5 text-[1.25rem]">No assessments done yet</h3>
                <p className="mx-auto mt-2 max-w-[40ch] text-[0.95rem] leading-relaxed text-ink-2">
                  Run {child.name}&rsquo;s first milestone check — about ten minutes, and their
                  report will live right here.
                </p>
                <ButtonLink
                  href={`/children/${child.id}/pay`}
                  size="lg"
                  className="mt-7"
                  iconRight={<IconArrowRight size={18} />}
                >
                  Start the check
                </ButtonLink>
              </Card>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-[var(--surface)] shadow-[var(--clay-sm)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line bg-[var(--surface-2)]">
                        <th className="px-6 py-4 text-[0.8rem] font-bold uppercase tracking-wider text-ink-3">
                          Assessment Name
                        </th>
                        <th className="px-6 py-4 text-[0.8rem] font-bold uppercase tracking-wider text-ink-3">
                          Time
                        </th>
                        <th className="px-6 py-4 text-[0.8rem] font-bold uppercase tracking-wider text-ink-3">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-[0.8rem] font-bold uppercase tracking-wider text-ink-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-soft">
                      {assessments.map((a) => (
                        <tr key={a.id} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span
                                className="grid size-10 shrink-0 place-items-center rounded-xl"
                                style={{
                                  background: a.completedAt ? "var(--st-on-track-soft)" : "var(--sun-100)",
                                  color: a.completedAt ? "var(--st-on-track)" : "var(--sun-700)",
                                }}
                              >
                                {a.completedAt ? <IconStarFilled size={18} /> : <IconRefresh size={18} />}
                              </span>
                              <div>
                                <p className="font-extrabold text-ink text-[0.95rem]">
                                  Genius Milestone Check
                                </p>
                                <p className="text-[0.78rem] font-semibold text-ink-3">
                                  Stage {stage.roman} · {stage.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[0.88rem] font-semibold text-ink-2 whitespace-nowrap">
                            {formatDateTime(a.completedAt || (a as any).createdAt || a.assessedOn)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge tone={a.completedAt ? "success" : "sun"}>
                              {a.completedAt ? "Completed" : "In progress"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2.5">
                              {a.completedAt ? (
                                <>
                                  <ButtonLink href={`/report/${a.id}`} variant="secondary" size="sm">
                                    View Report
                                  </ButtonLink>
                                  <ButtonLink
                                    href={`/report/${a.id}?download=1`}
                                    size="sm"
                                    iconLeft={<IconDownload size={15} />}
                                  >
                                    Download Report
                                  </ButtonLink>
                                </>
                              ) : (
                                <ButtonLink href={`/assessment/${a.id}`} size="sm">
                                  Resume Check
                                </ButtonLink>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Shell>
        </Section>

        {/* ══ 2. latest report breakdown ═══════════════════════════════════ */}
        {latest && result && (
          <Section size="sm">
            <Shell width="wide">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="eyebrow eyebrow-accent">Latest evaluation</p>
                  <h2 className="mt-1">Recent check breakdown</h2>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <ButtonLink href={`/report/${latest.id}`} variant="secondary" size="sm">
                    Open full report
                  </ButtonLink>
                  <ButtonLink
                    href={`/report/${latest.id}?download=1`}
                    size="sm"
                    iconLeft={<IconDownload size={16} />}
                  >
                    Download Report
                  </ButtonLink>
                </div>
              </div>

              <Card variant="clay" className="mt-5 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line-soft p-6">
                  <div className="flex items-center gap-3">
                    <StatusChip
                      status={result.overallStatus}
                      label={STATUSES[result.overallStatus].label}
                      solid
                      size="lg"
                    />
                    <span className="flex items-center gap-1.5 text-[0.85rem] font-semibold text-ink-3">
                      <IconCalendar size={15} />
                      {formatDate(latest.assessedOn)}
                    </span>
                  </div>
                  {!result.suppressDq && result.overallDq !== null && (
                    <span className="flex items-center gap-2 text-[0.85rem] font-semibold text-ink-3">
                      <IconChart size={16} />
                      Average{" "}
                      <strong className="tnum text-[1.05rem] font-extrabold text-ink">
                        {result.overallDq}
                      </strong>
                      <span className="text-ink-3">/ 100</span>
                    </span>
                  )}
                </div>

                <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
                  {result.domainScores.map((s) => {
                    const d = DOMAIN_BY_CODE[s.domain];
                    const value = s.dq === null ? s.percent * 100 : s.dq;
                    return (
                      <div key={s.domain} className="flex items-center gap-3.5">
                        <SectionTile code={s.domain} size={40} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[0.88rem] font-bold text-ink">
                              {d.name}
                            </span>
                            <span className="tnum text-[0.82rem] font-extrabold text-ink-3">
                              {Math.round(value)}
                            </span>
                          </div>
                          <Meter
                            value={Math.min(100, value)}
                            color={domainColor(s.domain)}
                            className="mt-1.5 !h-2.5"
                            label={`${d.name}: ${Math.round(value)} out of an expected 100`}
                            animate
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Shell>
          </Section>
        )}

        {/* ══ 3. their stage on the journey ══════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <p className="eyebrow eyebrow-accent">Developmental milestone ladder</p>
            <h2 className="mt-1">Their stage on the journey</h2>
            <Card variant="clay" className="mt-5 overflow-x-auto p-6 sm:p-8">
              <BrainJourney
                stages={STAGE_JOURNEY}
                current={stage.order}
                className="h-auto w-full min-w-[680px]"
              />
            </Card>
          </Shell>
        </Section>
      </main>

      <Footer />
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

function formatDateTime(isoOrDate?: string | null): string {
  if (!isoOrDate) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) {
    return new Date(`${isoOrDate}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
