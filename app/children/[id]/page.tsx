"use client";

import { use, useEffect, useMemo, useState } from "react";
import { DOMAIN_BY_CODE, STAGE_JOURNEY } from "@/content/domains";
import { stageForAge } from "@/lib/stage";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { STATUSES, scoreAssessment } from "@/lib/scoring";
import {
  assessmentsForChild,
  getChild,
  latestAssessmentForChild,
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
    setChild(getChild(id));
    setAssessments(assessmentsForChild(id));
  }, [id]);

  const latest = useMemo(
    () => (child ? latestAssessmentForChild(child.id) : null),
    // assessments is in the dep list so the card refreshes after a new check
    [child, assessments],
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
          <ButtonLink href={`/children/${child.id}/assessments`} size="sm" iconRight={<IconArrowRight size={16} />}>
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
                  <p className="mt-1.5 text-[0.95rem] font-semibold text-white/75">
                    {formatAge(age.chronologicalMonths)} ·{" "}
                    {child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—"} · born{" "}
                    {formatDate(child.dob)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[0.82rem] font-bold text-white backdrop-blur">
                    <IconSparkle size={15} />
                    Stage {stage.roman} of VII · {stage.name}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {[
                  { value: completed, label: "Reports" },
                  { value: stage.roman, label: "Stage" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="min-w-[92px] rounded-[var(--radius)] bg-white/12 px-4 py-3 text-center backdrop-blur"
                  >
                    <p
                      className="tnum text-[1.5rem] font-extrabold text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {s.value}
                    </p>
                    <p className="text-[0.74rem] font-bold text-white/70">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Shell>

        {/* ══ latest report ══════════════════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2>Latest report</h2>
              {latest && result && (
                <div className="flex flex-wrap gap-2.5">
                  <ButtonLink href={`/report/${latest.id}`} variant="secondary" size="sm">
                    Open full report
                  </ButtonLink>
                  <ButtonLink
                    href={`/report/${latest.id}?download=1`}
                    size="sm"
                    iconLeft={<IconDownload size={16} />}
                  >
                    Download
                  </ButtonLink>
                </div>
              )}
            </div>

            {!latest || !result ? (
              <Card variant="clay" className="mt-5 p-8 text-center sm:p-12">
                <Mascot size={88} mood="wave" className="mx-auto" />
                <h3 className="mt-5 text-[1.25rem]">No report yet</h3>
                <p className="mx-auto mt-2 max-w-[40ch] text-[0.95rem] leading-relaxed text-ink-2">
                  Run {child.name}&rsquo;s first milestone check — about ten minutes, and their
                  report will live right here from then on.
                </p>
                <ButtonLink
                  href={`/children/${child.id}/assessments`}
                  size="lg"
                  className="mt-7"
                  iconRight={<IconArrowRight size={18} />}
                >
                  Start the check
                </ButtonLink>
              </Card>
            ) : (
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
            )}
          </Shell>
        </Section>

        {/* ══ where they are on the journey ══════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <h2>Their stage</h2>
            <Card variant="clay" className="mt-5 overflow-x-auto p-6 sm:p-8">
              <BrainJourney
                stages={STAGE_JOURNEY}
                current={stage.order}
                className="h-auto w-full min-w-[680px]"
              />
            </Card>
          </Shell>
        </Section>

        {/* ══ history ════════════════════════════════════════════════════ */}
        {assessments.length > 0 && (
          <Section size="sm">
            <Shell width="wide">
              <h2>All checks</h2>
              <ul className="mt-5 list-none space-y-3 p-0">
                {assessments.map((a) => (
                  <li key={a.id}>
                    <a
                      href={a.completedAt ? `/report/${a.id}` : `/assessment/${a.id}`}
                      className="clay clay-press flex items-center justify-between gap-4 p-4 sm:p-5"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className="grid size-11 shrink-0 place-items-center rounded-2xl"
                          style={{
                            background: a.completedAt
                              ? "var(--st-on-track-soft)"
                              : "var(--sun-100)",
                            color: a.completedAt ? "var(--st-on-track)" : "var(--sun-700)",
                          }}
                        >
                          {a.completedAt ? <IconStarFilled size={20} /> : <IconRefresh size={20} />}
                        </span>
                        <div>
                          <p className="text-[0.98rem] font-extrabold text-ink">
                            Genius Milestone Check
                          </p>
                          <p className="text-[0.82rem] font-semibold text-ink-3">
                            {formatDate(a.assessedOn)}
                          </p>
                        </div>
                      </div>
                      <Badge tone={a.completedAt ? "success" : "sun"}>
                        {a.completedAt ? "Completed" : "In progress"}
                      </Badge>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <ButtonLink
                  href={`/children/${child.id}/assessments`}
                  variant="secondary"
                  iconRight={<IconArrowRight size={17} />}
                >
                  Run another check
                </ButtonLink>
              </div>
            </Shell>
          </Section>
        )}
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
