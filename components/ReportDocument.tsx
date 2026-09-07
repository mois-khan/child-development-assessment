"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DOMAINS, DOMAIN_BY_CODE } from "@/content/domains";
import { BRAIN_STAGES, STAGE_BY_ID, cellFor } from "@/content/stages";
import { formatAge, summariseAge } from "@/lib/age";
import { DISCLAIMER, domainNote, headline, nextSteps, summary } from "@/lib/narrative";
import { STATUSES, scoreAssessment } from "@/lib/scoring";
import { stageForAge } from "@/lib/stage";
import { getAssessment, type StoredAssessment } from "@/lib/store";
import type {
  AssessmentResult,
  BrainStage,
  Child,
  DomainCode,
  DomainScore,
} from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Disclaimer,
  Footer,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconDownload,
  IconHeart,
  IconPhone,
  IconPlay,
  IconSparkle,
  LoadError,
  Mascot,
  Section,
  SectionIcon,
  SectionTile,
  Shell,
  StatusChip,
  TopBar,
  Wordmark,
  domainColor,
  statusColor,
} from "@/components/ui";
import { MilestoneVideoRow } from "@/components/report/MilestoneVideoRow";
import { CourseRow } from "@/components/report/CourseRow";

export function ReportDocument({
  id,
  isAdmin = false,
}: {
  id: string;
  isAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<StoredAssessment | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    getAssessment(id)
      .then(found => {
        if (active) setRecord(found);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => { active = false; };
  }, [id, loadAttempt]);

  const result = useMemo<AssessmentResult | null>(() => {
    if (!record) return null;
    return scoreAssessment({
      child: record.child,
      assessedOn: record.assessedOn,
      responses: record.responses,
      details: record.details,
      stagesByDomain: record.stagesByDomain,
    });
  }, [record]);

  // ?download=1 (from the child's profile) opens the print dialogue directly.
  useEffect(() => {
    if (result && searchParams.get("download") === "1") {
      const t = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(t);
    }
  }, [result, searchParams]);

  if (loadError) {
    return (
      <>
        {!isAdmin && <TopBar />}
        <Shell width="narrow">
          <LoadError onRetry={() => setLoadAttempt((n) => n + 1)} />
        </Shell>
      </>
    );
  }

  if (record === undefined) {
    return (
      <>
        {!isAdmin && <TopBar />}
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Building the report…</p>
        </Shell>
      </>
    );
  }

  if (record === null || result === null) {
    return (
      <>
        {!isAdmin && <TopBar />}
        <Shell width="narrow">
          <div className="pt-20 text-center">
            <Mascot size={92} mood="think" className="mx-auto" />
            <h1 className="mt-6">We couldn&rsquo;t find that report</h1>
            <p className="prose-read mx-auto mt-3 max-w-[42ch]">
              This report doesn&rsquo;t exist, or isn&rsquo;t linked to your account.
            </p>
            <ButtonLink href="/children" className="mt-8">
              Go to your children
            </ButtonLink>
          </div>
        </Shell>
      </>
    );
  }

  const child = record.child;
  const age = summariseAge(child.dob, record.assessedOn, child.gestationalWeeks);
  const startStage = stageForAge(age.assessedMonths);
  const ordered = [...result.domainScores].sort(
    (a, b) => DOMAIN_BY_CODE[a.domain].order - DOMAIN_BY_CODE[b.domain].order,
  );

  const metric = (d: DomainScore) => (d.dq === null ? d.percent * 100 : d.dq);
  const focus =
    result.focusAreas.length > 0
      ? result.focusAreas
      : [...result.domainScores].sort((a, b) => metric(a) - metric(b)).slice(0, 2).map((d) => d.domain);



  return (
    <>
      {!isAdmin && (
        <TopBar
          right={
            child.id ? (
              <ButtonLink href={`/children/${child.id}`} variant="ghost" size="sm">
                {child.name}&rsquo;s profile
              </ButtonLink>
            ) : undefined
          }
        />
      )}

      <main className="pb-16">
        <Shell width="wide">
          {/* print-only masthead — the logo already carries the programme
              name, so the on-screen eyebrow line under it is redundant on
              paper and is hidden there. */}
          <div className="hidden pt-6 print:block">
            <Wordmark height={48} />
          </div>

          {/* ══ page 1 · the cover ═══════════════════════════════════════
              On paper this becomes a plain letterhead: white, left-aligned,
              a single rule underneath — see .report-cover in globals.css. */}
          <section
            className={`report-cover relative overflow-hidden px-6 py-10 text-left sm:px-12 sm:py-14 ${isAdmin ? "mt-0" : "mt-7"}`}
            style={{
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(160deg, var(--brand-500) 0%, var(--brand-700) 58%, var(--brand-900) 100%)",
              boxShadow:
                "0 2px 5px rgba(69, 77, 93, 0.14), 0 40px 70px -28px color-mix(in srgb, var(--brand-600) 60%, transparent)",
            }}
          >
            <span
              aria-hidden="true"
              className="bloom"
              style={{ width: 420, height: 420, top: -200, left: "-4%", "--bloom-color": "var(--brand-300)", opacity: 0.5 } as React.CSSProperties}
            />
            <span
              aria-hidden="true"
              className="bloom"
              style={{ width: 300, height: 300, bottom: -160, right: "4%", "--bloom-color": "var(--sun-400)", opacity: 0.22 } as React.CSSProperties}
            />
            <span
              aria-hidden="true"
              className="bloom print:hidden"
              style={{ width: 220, height: 220, top: -70, right: "2%", "--bloom-color": "var(--brand-200)", opacity: 0.4 } as React.CSSProperties}
            />

            <div className="relative flex flex-col gap-8 sm:gap-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/65 print:hidden">
                    Kaushalya Genius Kid Program
                  </p>
                  <h1 className="display mt-3 !text-3xl leading-[1.08] text-white sm:!text-4xl">
                    {child.name}&rsquo;s
                    <br className="hidden sm:block" /> Milestone Report
                  </h1>
                </div>

                <div className="relative shrink-0 print:hidden">
                  <span
                    aria-hidden="true"
                    className="absolute -inset-3 rounded-full blur-xl"
                    style={{ background: "radial-gradient(circle, rgba(251,191,36,0.4), transparent 70%)" }}
                  />
                  <Avatar
                    name={child.name}
                    photoUrl={child.photoUrl}
                    size={88}
                    ring
                    className="relative"
                    style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.92), 0 10px 24px -8px rgba(12,10,40,0.55)" }}
                  />
                </div>
              </div>

              <dl className="cover-meta">
                {[
                  ["Age", formatAge(age.chronologicalMonths)],
                  [
                    "Gender",
                    child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—",
                  ],
                  ["Assessment date", formatDate(record.assessedOn)],
                  [
                    "Started at",
                    `Stage ${startStage.roman} · ${startStage.name}`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="cover-meta-item">
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="no-print">
                <Button
                  variant="sun"
                  size="lg"
                  onClick={() => window.print()}
                  iconLeft={<IconDownload size={18} />}
                >
                  Download Report
                </Button>
              </div>

              {/* print-only: the avatar has no soft glow on paper, just a plain
                  bordered circle beside the identity block. */}
              <div className="hidden items-center gap-4 print:flex">
                <Avatar name={child.name} photoUrl={child.photoUrl} size={64} ring />
                <p className="text-sm font-bold text-ink">{child.name}</p>
              </div>
            </div>
          </section>

          {/* ══ page 2 · progress at a glance ════════════════════════════ */}
          <Section size="sm" className="print-break">
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip
                status={result.overallStatus}
                label={STATUSES[result.overallStatus].label}
                solid
                size="lg"
              />
              {!result.suppressDq && result.overallDq !== null && (
                <span className="text-sm font-semibold text-ink-3">
                  Average across the six areas{" "}
                  <strong className="tnum text-base font-extrabold text-ink">
                    {result.overallDq}
                  </strong>{" "}
                  <span className="text-ink-3">(100 is on track for age)</span>
                </span>
              )}
            </div>

            <h2 className="mt-5 max-w-[24ch]">{headline(result, child)}</h2>

            {result.overallRaisedBy && (
              <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink-2">
                The average looks healthy because most areas are strong. We have still flagged this
                report as{" "}
                <strong className="font-bold">
                  {STATUSES[result.overallStatus].label.toLowerCase()}
                </strong>{" "}
                because{" "}
                <strong className="font-bold">
                  {DOMAIN_BY_CODE[result.overallRaisedBy].name.toLowerCase()}
                </strong>{" "}
                needs attention on its own, and an average can hide that.
              </p>
            )}

            <Card variant="clay" className="mt-8 p-6 sm:p-8">
              <p className="eyebrow mb-2">Progress, area by area</p>
              <p className="mb-6 text-sm font-medium text-ink-3">
                These are screening terms, not a diagnosis — see the note at the end of this
                report.
              </p>
              <div className="overflow-x-auto">
                <div className="progress-matrix">
                  <span aria-hidden="true" />
                  <div className="progress-matrix-headrow">
                    {STAGES.map((s) => (
                      <span key={s.label} className="progress-matrix-headcell">
                        {s.label}
                      </span>
                    ))}
                  </div>
                  {ordered.map((score) => {
                    const d = DOMAIN_BY_CODE[score.domain];
                    const value = score.dq === null ? score.percent * 100 : score.dq;
                    const color = domainColor(score.domain);
                    const { index, frac } = stagePosition(value);
                    const pct = ((index + frac) / STAGES.length) * 100;
                    return (
                      <Fragment key={score.domain}>
                        <div className="progress-matrix-row-label">
                          <SectionTile code={score.domain} size={34} />
                          <span className="truncate text-sm font-extrabold text-ink">
                            {d.name}
                          </span>
                        </div>
                        <div
                          className="progress-matrix-row-track"
                          role="img"
                          aria-label={`${d.name}: ${STAGES[index].label}, score ${Math.round(value)}`}
                        >
                          <div className="progress-matrix-grid">
                            {STAGES.map((s) => (
                              <span key={s.label} className="progress-matrix-cell" />
                            ))}
                          </div>
                          <div
                            className="progress-matrix-fill grow-in"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 78%, black))`,
                            }}
                          />
                          <div
                            className="progress-matrix-dot"
                            style={{ left: `${pct}%`, ["--dot-color" as string]: color }}
                          />
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </Card>
          </Section>

          {/* ══ page 2b · the chart itself, filled in ═══════════════════════ */}
          <Section size="sm" className="print-break">
            <h2>{child.name}&rsquo;s Developmental Profile</h2>
            <Card variant="clay" className="mt-6 overflow-hidden !p-0">
              <DevelopmentalProfileChart result={result} childName={child.name} />
            </Card>
          </Section>

          {/* ══ page 3+ · area by area ═══════════════════════════════════ */}
          <Section size="sm" className="print-break">
            <h2>Area by area</h2>

            <div className="mt-6 space-y-5">
              {ordered.map((score) => (
                <DomainCard
                  key={score.domain}
                  score={score}
                  note={domainNote(score, child)}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </Section>

          {/* ══ summary & recommendations ════════════════════════════════ */}
          <Section size="sm" className="print-break">
            <h2>Summary &amp; recommendations</h2>

            <div className="mt-6 grid gap-6 lg:grid-cols-2 items-stretch">
              <ExecutiveSummaryCard result={result} child={child} />
              <DefaultRecommendationCard stage={startStage} child={child} />
            </div>

            <div className="mt-6">
              <ActionStepsCard result={result} child={child} />
            </div>

            {/* Admin-curated course recommendations, keyed to the stage of the
                child's biggest focus area — not shown in the admin's own
                internal report view, where there's no "explore courses" CTA
                to make. CourseRow returns null when there's nothing active
                for that stage, so DefaultRecommendationCard above always
                acts as the fallback either way. */}
            {!isAdmin && (
              <CourseRow
                stageId={
                  result.domainScores.find((d) => d.domain === focus[0])?.achievedStage
                    || startStage.id
                }
                childName={child.name}
              />
            )}
          </Section>

          {/* ══ footer of the document ═══════════════════════════════════ */}
          <Section size="sm">
            <Card variant="clay" className="no-print flex flex-wrap items-center justify-between gap-5 p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--st-consult-soft)] text-[var(--st-consult)]">
                  <IconHeart size={20} />
                </span>
                <div>
                  <p className="text-base font-extrabold text-ink">Keep this report</p>
                  <p className="text-sm font-semibold text-ink-3">
                    It stays on {child.name}&rsquo;s profile — download it any time.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                  iconLeft={<IconDownload size={17} />}
                >
                  Download
                </Button>
                {child.id && (
                  <ButtonLink href={`/children/${child.id}`} iconRight={<IconArrowRight size={17} />}>
                    Back to profile
                  </ButtonLink>
                )}
              </div>
            </Card>

            <div className="mt-8 print:mt-0">
              <Disclaimer text={DISCLAIMER} />
              <p className="mt-4 text-xs leading-relaxed text-ink-3">
                Milestones adapted from the CDC <em>Learn the Signs. Act Early.</em> checklists, the
                NIDCD hearing and communication checklist, and WHO motor milestone data. Item bank{" "}
                {record.bankVersion}.
              </p>

              {/* print-only colophon — the closing line a real document has */}
              <div className="mt-6 hidden border-t border-line-soft pt-4 text-[9pt] text-ink-3 print:flex print:items-center print:justify-between">
                <span>
                  Kaushalya Genius Kid Program · Prepared for {child.name} on {formatDate(record.assessedOn)}
                </span>
                <span>www.kaushalyageniuskid.com</span>
              </div>
            </div>
          </Section>
        </Shell>
      </main>

      {!isAdmin && <Footer />}
    </>
  );
}

/* ══ the chart itself, filled in ══════════════════════════════════════════ */

type CellState = "reached" | "current" | "next" | "ahead";

/**
 * Where one competence's score puts it on one row of the chart.
 *
 * "reached" and "current" only ever look at the stage the child actually
 * landed on (DomainScore.achievedStage) — they never assume a stage was
 * literally asked about. That is deliberate: reaching stage VI implies I
 * through V without re-testing them, exactly as the physical chart assumes.
 * "next" is the one state that DOES require the stage to have been asked
 * (DomainScore.stagesAsked) — we only draw a progress bar into a stage we
 * have actual answers for, never a guess.
 */
function cellState(
  score: DomainScore,
  stage: BrainStage,
): { state: CellState; frac?: number } {
  const achieved = STAGE_BY_ID[score.achievedStage];

  if (achieved) {
    if (stage.order < achieved.order) return { state: "reached" };
    if (stage.order === achieved.order) return { state: "current" };
    if (stage.order === achieved.order + 1 && score.stagesAsked.includes(stage.id)) {
      const span = stage.averageMonths - achieved.averageMonths;
      const frac =
        span <= 0
          ? 0
          : clamp01((score.neurologicalMonths - achieved.averageMonths) / span);
      return { state: "next", frac };
    }
    return { state: "ahead" };
  }

  // Nothing passed yet: anchor "current" on the lowest stage we actually
  // asked about, using the domain's overall answer rate as its fill.
  const lowestAsked = [...score.stagesAsked]
    .map((id) => STAGE_BY_ID[id])
    .filter((s): s is BrainStage => !!s)
    .sort((a, b) => a.order - b.order)[0];
  if (lowestAsked && stage.id === lowestAsked.id) {
    return { state: "current", frac: score.percent };
  }
  return { state: "ahead" };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/**
 * The Developmental Profile chart, filled in with one child's answers.
 *
 * Seven rows (the brain stages, reflex at the bottom to match the printed
 * chart), six columns (the competences, in the chart's own order — the three
 * that take information in, then the three that put it back out). Every one
 * of the 42 cells carries the chart's own wording, so this reads as the same
 * document a family already has on paper, just marked up with where their
 * child stands.
 */
function DevelopmentalProfileChart({
  result,
  childName,
}: {
  result: AssessmentResult;
  childName: string;
}) {
  const scoreByDomain = Object.fromEntries(
    result.domainScores.map((s) => [s.domain, s]),
  ) as Record<DomainCode, DomainScore>;
  const rows = [...BRAIN_STAGES].sort((a, b) => b.order - a.order); // VII at top

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line-soft px-5 py-3.5 text-xs font-semibold text-ink-3 sm:px-7">
        <LegendItem swatch={<LegendCheck />} label="Already reached" />
        <LegendItem swatch={<LegendRing />} label={`${childName} is here`} />
        <LegendItem swatch={<LegendDash />} label="In progress" />
        <LegendItem swatch={<LegendFaded />} label="Not reached yet" />
      </div>

      <div className="dp-chart-scroll">
        <div className="dp-chart">
          <div className="dp-chart-head dp-chart-corner" aria-hidden="true" />
          {DOMAINS.map((d) => (
            <div key={d.code} className="dp-chart-head">
              <SectionIcon code={d.code} size={17} />
              <span>{d.short}</span>
            </div>
          ))}

          {rows.flatMap((stage) => [
              <div
                key={`${stage.id}-label`}
                className="dp-chart-stage"
                style={{
                  background: `hsl(${stage.hue} 68% 93%)`,
                  color: `hsl(${stage.hue} 60% 28%)`,
                }}
              >
                <span className="dp-chart-roman">{stage.roman}</span>
                <span className="dp-chart-stage-name">{stage.name}</span>
              </div>,
              ...DOMAINS.map((d) => {
                const score = scoreByDomain[d.code];
                const cell = cellFor(stage.id, d.code);
                const { state, frac } = cellState(score, stage);
                const color = domainColor(d.code);
                return (
                  <div
                    key={`${stage.id}-${d.code}`}
                    className="dp-chart-cell"
                    data-state={state}
                    style={
                      {
                        background: `hsl(${stage.hue} 55% 96%)`,
                        "--cell-color": color,
                      } as React.CSSProperties
                    }
                  >
                    {state === "reached" && (
                      <span className="dp-chart-marker dp-chart-marker-check" style={{ color }}>
                        <IconCheck size={11} />
                      </span>
                    )}
                    {state === "current" && (
                      <span className="dp-chart-marker dp-chart-marker-here">
                        <Avatar name={childName} size={20} />
                      </span>
                    )}
                    {/* Inline, theme-independent ink — this cell's background is
                        always a light tint of the row's own hue, by design, the
                        same way the printed chart never changes with the light in
                        the room. var(--ink) would flip to a pale colour in dark
                        mode and vanish against it, so the text carries its own
                        dark shade of the same hue instead. */}
                    <p
                      className="dp-chart-cell-desc"
                      style={{ color: `hsl(${stage.hue} 45% 20%)` }}
                    >
                      {cell.description}
                    </p>
                    <p
                      className="dp-chart-cell-kind"
                      style={{ color: `hsl(${stage.hue} 25% 38%)` }}
                    >
                      {cell.kind}
                    </p>
                    {state === "next" && frac !== undefined && (
                      <span
                        className="dp-chart-cell-fill"
                        style={{ width: `${Math.max(6, frac * 100)}%`, background: color }}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              }),
          ])}
        </div>
      </div>

      <p className="border-t border-line-soft px-5 py-3.5 text-xs leading-relaxed text-ink-3 sm:px-7">
        Cells below where {childName} is marked are assumed in place, the same way the paper
        chart reads — reaching a later stage means the earlier ones are already there.
      </p>
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
}

function LegendCheck() {
  return (
    <span
      className="grid size-4 place-items-center rounded-full"
      style={{ background: "var(--surface-3)", color: "var(--ink-2)" }}
    >
      <IconCheck size={10} />
    </span>
  );
}

function LegendRing() {
  return (
    <span
      className="size-4 rounded-full"
      style={{ border: "2.5px solid var(--ink-2)", background: "var(--surface)" }}
    />
  );
}

function LegendDash() {
  return (
    <span
      className="size-4 rounded-full"
      style={{ border: "2px dashed var(--ink-3)", background: "var(--surface)" }}
    />
  );
}

function LegendFaded() {
  return (
    <span
      className="size-4 rounded-full"
      style={{ background: "var(--surface-3)", opacity: 0.5 }}
    />
  );
}

/* ══ the summary, readable rather than a wall of text ══════════════════════ */

/**
 * `summary()` (lib/narrative.ts) returns 2-4 sentences as plain paragraph
 * strings — reviewed prose, not something this page should restructure. What
 * it can fix is how those paragraphs are read: the first one is always scene-
 * setting (the child's age, how this report was scored), so it drops back to
 * a small muted line rather than competing with the verdict; the paragraphs
 * that actually say how the child is doing get a colour-coded callout, more
 * breathing room, and their key phrases picked out, so the one sentence a
 * busy parent needs doesn't have to be found by reading every word.
 */
function ExecutiveSummaryCard({ result, child }: { result: AssessmentResult; child: Child }) {
  const [, ...verdict] = summary(result, child);

  const terms = [
    child.name,
    ...DOMAINS.map((d) => d.name.toLowerCase()),
    STATUSES[result.overallStatus].label.toLowerCase(),
  ];

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[var(--brand-200)]/80 bg-gradient-to-br from-[var(--brand-50)]/50 via-[var(--surface)] to-[var(--surface)] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(77,20,53,0.08)]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--brand-100)] pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-200)] bg-[var(--brand-50)] px-3 py-1 text-xs font-bold text-[var(--brand-600)] shadow-xs">
              <IconCalendar size={13} className="text-[var(--brand-600)]" />
              <span>{child.name} · {formatAge(result.assessedMonths)}</span>
            </span>
            <span className="rounded-full bg-[var(--brand-600)] px-2.5 py-0.5 text-[0.68rem] font-black uppercase tracking-wider text-white shadow-xs">
              Overall Summary
            </span>
          </div>

          <StatusChip status={result.overallStatus} label={STATUSES[result.overallStatus].label} solid size="sm" />
        </div>

        <div className="mt-5">
          <div className="mb-2.5 flex items-center justify-between">
            <h4 className="text-[1.02rem] font-extrabold tracking-tight text-[var(--ink)]">
              Developmental Profile Verdict
            </h4>
            <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--brand-600)]">
              6 Areas Analyzed
            </span>
          </div>

          <div
            className="rounded-xl border border-[var(--brand-100)] bg-[var(--surface)]/90 p-4.5 sm:p-5 shadow-xs"
            style={{ borderLeft: `4px solid ${statusColor(result.overallStatus)}` }}
          >
            <div className="space-y-3">
              {verdict.map((p) => (
                <p key={p.slice(0, 40)} className="text-[0.95rem] leading-[1.7] text-[var(--ink)] font-medium">
                  <Highlight text={p} terms={terms} />
                </p>
              ))}
            </div>

            {(result.strengths.length > 0 || result.focusAreas.length > 0) && (
              <div className="mt-4 flex flex-col gap-2.5 border-t border-[var(--line-soft)] pt-3.5">
                {result.strengths.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                      Notable Strengths:
                    </span>
                    {result.strengths.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--st-on-track)]/25 bg-[var(--st-on-track-soft)] px-2.5 py-1 text-xs font-bold text-[var(--st-on-track-ink)]"
                      >
                        <SectionIcon code={code} size={13} />
                        {DOMAIN_BY_CODE[code].name}
                      </span>
                    ))}
                  </div>
                )}

                {result.focusAreas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                      Areas to Nurture:
                    </span>
                    {result.focusAreas.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--st-needs-focus)]/25 bg-[var(--st-needs-focus-soft)] px-2.5 py-1 text-xs font-bold text-[var(--st-needs-focus-ink)]"
                      >
                        <SectionIcon code={code} size={13} />
                        {DOMAIN_BY_CODE[code].name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {result.overallDq !== null && !result.suppressDq && (
        <div className="mt-5 flex items-center justify-between rounded-xl border border-[var(--brand-200)]/80 bg-[var(--brand-50)]/70 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-600)] text-white shadow-xs">
              <IconSparkle size={15} />
            </span>
            <div>
              <p className="text-[0.82rem] font-bold text-[var(--brand-600)] leading-tight">
                Developmental Quotient
              </p>
              <p className="text-[0.72rem] font-medium text-[var(--ink-2)] mt-0.5 leading-tight">
                Score of 100 represents on-track for age
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="tnum text-2xl font-black text-[var(--brand-600)]">{result.overallDq}</span>
            <span className="text-xs font-bold text-[var(--brand-600)]/70">pts</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionStepsCard({ result, child }: { result: AssessmentResult; child: Child }) {
  const steps = nextSteps(result, child);

  const stepIcons = [
    <IconCalendar key="cal" size={16} />,
    <IconSparkle key="act" size={16} />,
    <IconHeart key="doc" size={16} />,
    <IconClock key="clk" size={16} />,
  ];

  const stepHeadings = [
    "Milestone Progression Check",
    "Daily Developmental Routine",
    "Pediatric & Specialist Care",
    "Continuous Observation",
  ];

  return (
    <div className="rounded-2xl border border-line bg-[var(--surface)] p-6 sm:p-7 shadow-[0_2px_12px_-2px_rgba(61,43,53,0.06)]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[1.1rem] font-extrabold tracking-tight text-[var(--ink)]">
            Actionable Next Steps
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-200)] bg-[var(--brand-50)] px-3 py-1 text-xs font-bold text-[var(--brand-600)]">
          <IconCheck size={13} />
          Evidence-Based Action Plan
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between rounded-xl border border-line bg-[var(--surface-2)]/60 p-4.5 transition-all hover:border-[var(--line-strong)] hover:shadow-xs"
          >
            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-[var(--brand-600)] text-xs font-black text-white shadow-xs">
                  {idx + 1}
                </span>
                <span className="grid size-7 place-items-center rounded-lg border border-line bg-[var(--surface)] text-[var(--brand-600)]">
                  {stepIcons[idx % stepIcons.length]}
                </span>
              </div>
              <h4 className="mb-1.5 text-[0.9rem] font-bold text-[var(--ink)]">
                {stepHeadings[idx % stepHeadings.length]}
              </h4>
              <p className="text-[0.84rem] font-medium leading-relaxed text-[var(--ink-2)]">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Wraps any occurrence of `terms` (case-insensitive) in the text with `<strong>`. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  const unique = Array.from(new Set(terms.filter((t) => t.trim().length > 0)));
  if (unique.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${unique.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) =>
        unique.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <strong key={i} className="font-extrabold text-ink">
            {part}
          </strong>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ══ one area ══════════════════════════════════════════════════════════════ */

function DomainCard({
  score,
  note,
  isAdmin = false,
}: {
  score: DomainScore;
  note: string;
  isAdmin?: boolean;
}) {
  const domain = DOMAIN_BY_CODE[score.domain];
  const color = domainColor(score.domain);
  const value = score.dq === null ? score.percent * 100 : score.dq;
  // Open by default for areas with developmental focus needs; collapsed for
  // areas already on track so parents can focus on what matters most.
  const defaultOpen = score.status === "mild" || score.status === "delay" || score.status === "significant";

  return (
    <div className="group/domain relative overflow-hidden rounded-2xl border border-line bg-[var(--surface)] shadow-[0_2px_10px_-2px_rgba(61,43,53,0.06)] transition-all duration-200 hover:border-[var(--line-strong)] hover:shadow-[0_8px_20px_-4px_rgba(61,43,53,0.1)]">
      <details className="w-full" open={defaultOpen}>
        <summary className="group/summary cursor-pointer list-none p-4.5 select-none transition-colors duration-150 hover:bg-[var(--surface-2)] sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3.5">
              {/* Vibrant domain icon tile */}
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover/summary:scale-105 sm:size-12"
                style={{
                  background: `color-mix(in srgb, ${color} 14%, var(--surface))`,
                  color,
                  border: `1.5px solid color-mix(in srgb, ${color} 30%, var(--line))`,
                  boxShadow: `0 2px 8px -2px color-mix(in srgb, ${color} 25%, transparent)`,
                }}
                aria-hidden="true"
              >
                <SectionIcon code={score.domain} size={22} />
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[1.05rem] font-extrabold tracking-tight text-[var(--ink)] leading-snug sm:text-[1.12rem]">
                  {domain.name}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[0.82rem] font-semibold text-[var(--ink-2)] sm:text-[0.85rem]">
                  {domain.blurb}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 sm:gap-3">
              <StatusChip status={score.status} label={STATUSES[score.status].label} />
              <span
                aria-hidden="true"
                className="no-print grid size-7 place-items-center rounded-full border border-line bg-[var(--surface-2)] text-[var(--ink-2)] transition-transform duration-200 group-open/domain:rotate-90 hover:bg-[var(--surface-3)] sm:size-8"
              >
                <IconChevronRight size={15} />
              </span>
            </div>
          </div>

          {/* Slim progress bar and score */}
          <div className="mt-3.5 flex items-center gap-3.5 sm:mt-4 sm:gap-4">
            <div
              className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]"
              role="img"
              aria-label={`${domain.name} score: ${Math.round(value)}`}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(100, value)}%`,
                  background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 80%, black))`,
                }}
              />
            </div>
            <div className="flex shrink-0 items-baseline gap-1">
              <span className="tnum text-[1rem] font-black text-[var(--ink)]">{Math.round(value)}</span>
              <span className="text-[0.72rem] font-bold uppercase tracking-wider text-[var(--ink-3)]">
                pts
              </span>
            </div>
          </div>
        </summary>

        {/* Expanded body with high-contrast narrative and modern metric cards */}
        <div className="border-t border-line-soft bg-[var(--surface-2)] px-4.5 py-4 sm:px-5 sm:py-5">
          <p className="text-[0.95rem] font-normal leading-relaxed text-[var(--ink)]">{note}</p>

          <div className="mt-4.5 border-t border-line pt-3.5">
            <p className="mb-2.5 text-[0.7rem] font-bold uppercase tracking-wider text-[var(--ink-2)]">
              Where they stand, item by item
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Doing */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--st-on-track)]/30 bg-[var(--st-on-track-soft)] px-3.5 py-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--st-on-track)] text-white shadow-xs">
                  <IconCheck size={12} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="tnum text-base font-black text-[var(--st-on-track-ink)] leading-none">
                      {score.achieved.length}
                    </span>
                    <span className="truncate text-xs font-bold text-[var(--st-on-track-ink)]">Doing</span>
                  </div>
                  <p className="mt-1 truncate text-[0.72rem] font-semibold text-[var(--st-on-track-ink)]/80 leading-none">
                    Milestones achieved
                  </p>
                </div>
              </div>

              {/* Not yet */}
              <div className="flex items-center gap-3 rounded-xl border border-line bg-[var(--surface)] px-3.5 py-3 shadow-xs">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--surface-3)] text-[var(--ink-2)]">
                  <IconClock size={12} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="tnum text-base font-black text-[var(--ink)] leading-none">
                      {score.notYet.length}
                    </span>
                    <span className="truncate text-xs font-bold text-[var(--ink)]">Not yet</span>
                  </div>
                  <p className="mt-1 truncate text-[0.72rem] font-semibold text-[var(--ink-3)] leading-none">
                    Next developmental steps
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Milestone video cards for this domain — admin-curated, fetched
              from DB. Not shown in the admin's own report preview. */}
          {!isAdmin && (
            <MilestoneVideoRow
              stageId={score.achievedStage || "s1"}
              domain={score.domain}
              domainName={DOMAIN_BY_CODE[score.domain].name}
            />
          )}
        </div>
      </details>
    </div>
  );
}

/* ══ course & programme recommendation ════════════════════════════════════
 * DefaultRecommendationCard is the always-present fallback CTA. CourseRow
 * (rendered alongside it above, parent view only) is the admin-curated
 * version — it fetches from course_recommendations and renders nothing when
 * that stage has no active cards, so the fallback below is never left
 * standing alone. */

function DefaultRecommendationCard({ stage, child }: { stage: BrainStage; child: Child }) {
  const primaryHref = "https://www.kaushalyageniuskid.com";
  const primaryLabel = `Explore Stage ${stage.roman} Programme`;
  const secondaryHref = "mailto:support@kaushalyageniuskid.com";
  const secondaryLabel = "Speak with a Child Specialist";

  const perks = [
    {
      title: "Daily Screen-Free Playbook",
      desc: `10 mins/day tailored to ${stage.name}`,
      icon: <IconCalendar size={14} />,
    },
    {
      title: "Step-by-Step Video Demonstrations",
      desc: "Parent-guided play across all 6 areas",
      icon: <IconPlay size={14} />,
    },
    {
      title: "Milestone Tracking & Expert Support",
      desc: "Checklists with counselor mentorship",
      icon: <IconCheck size={14} />,
    },
  ];

  return (
    <div
      className="recommend-card relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#8c3a63]/50 p-6 sm:p-7 text-white shadow-[0_12px_36px_-6px_rgba(77,20,53,0.32)]"
      style={{ background: "linear-gradient(152deg, #4d1435 0%, #3a0f28 50%, #200617 100%)" }}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-[#f8ce7c] border border-white/20 backdrop-blur-xs">
            <IconSparkle size={12} />
            RECOMMENDED PROGRAMME
          </span>
          <Mascot size={54} mood="wave" className="no-print drop-shadow-md" />
        </div>

        <h3 className="mt-3.5 text-[1.28rem] sm:text-[1.38rem] font-black tracking-tight text-white leading-tight">
          Milestones Acceleration: Stage {stage.roman}
        </h3>
        <p className="mt-1 text-[0.88rem] font-bold text-[#f8ce7c]">
          {stage.name} Phase · Personalised for {child.name}
        </p>

        <p className="mt-3 text-[0.88rem] leading-relaxed text-[#f6dce6] font-normal">
          The Kaushalya 0–6 developmental programme for {stage.name}: daily 10-minute guided
          screen-free play routines and expert parent videos across all six brain areas.
        </p>

        <div className="mt-4.5 space-y-2">
          {perks.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.08] px-3.5 py-2.5 backdrop-blur-xs"
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f8ce7c]/20 text-[#f8ce7c]">
                {p.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[0.82rem] font-bold text-white truncate">{p.title}</p>
                <p className="text-[0.72rem] text-[#ebb9ce] truncate">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="no-print mt-6 space-y-2.5 pt-2">
        <a
          href={primaryHref}
          target="_blank"
          rel="noreferrer"
          className="group/btn relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f8ce7c] via-[#f4a93b] to-[#e8971f] px-5 py-3.5 text-[0.94rem] font-black text-[#2a0b1d] shadow-lg shadow-black/25 transition-all duration-200 hover:brightness-105 active:scale-[0.99]"
        >
          <span>{primaryLabel}</span>
          <IconArrowRight size={17} className="transition-transform group-hover/btn:translate-x-1" />
        </a>

        <a
          href={secondaryHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-[0.85rem] font-bold text-white transition-colors hover:bg-white/15"
        >
          <IconPhone size={14} />
          <span>{secondaryLabel}</span>
        </a>

        <p className="text-center text-[0.7rem] font-semibold text-[#ebb9ce]/85 pt-1">
          ★ Trusted by 25,000+ Indian parents · 100% Screen-Free Home Method
        </p>
      </div>

      {/* Buttons don't work on paper — a printed report gets the plain
          addresses instead, written out in full. */}
      <dl className="hidden print:block print:space-y-1.5 print:border-t print:border-white/20 print:mt-4 print:pt-3 print:text-[9pt] text-[#f6dce6]">
        <div>
          <dt className="inline font-bold text-white">{primaryLabel}: </dt>
          <dd className="inline">{primaryHref.replace(/^https?:\/\//, "")}</dd>
        </div>
        <div>
          <dt className="inline font-bold text-white">{secondaryLabel}: </dt>
          <dd className="inline">{secondaryHref.replace(/^mailto:/, "")}</dd>
        </div>
      </dl>
    </div>
  );
}

/* ══ helpers ═══════════════════════════════════════════════════════════════ */

/**
 * The columns of the progress matrix — the chart's own TIME FRAME columns,
 * read as a quotient.
 *
 * These are not chosen thresholds. Every stage on the chart puts its slow
 * column at twice its average and its superior column at half, so reaching a
 * stage at the slow age is a quotient of 50, at the average age 100, and at
 * the superior age 200. The boundaries below are those three numbers, and the
 * labels are the chart's four verdicts.
 *
 * Deliberately NOT the old five-way "developmental delay" scale. This is a
 * screening result a parent reads alone, at home, about their own child, and
 * naming a delay is a clinician's job — see the wording rules at the top of
 * lib/narrative.ts.
 */
const STAGES = [
  { label: "Significant developmental delay", max: 50 },
  { label: "Developmental delay", max: 70 },
  { label: "Mild developmental gaps", max: 85 },
  { label: "Typically developing", max: 115 },
  { label: "Advanced development", max: Infinity },
] as const;

function stagePosition(value: number): { index: number; frac: number } {
  let lo = 0;
  for (let i = 0; i < STAGES.length; i++) {
    const hi = STAGES[i].max;
    if (value < hi || i === STAGES.length - 1) {
      const span = i === STAGES.length - 1 ? 25 : hi - lo;
      const frac = Math.min(1, Math.max(0, (value - lo) / span));
      return { index: i, frac };
    }
    lo = hi;
  }
  return { index: 0, frac: 0 };
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonths(m: number): string {
  const r = Math.round(m);
  if (r < 24) return `${r} months`;
  const y = Math.floor(r / 12);
  const rem = r % 12;
  return rem === 0 ? `${y} years` : `${y}y ${rem}m`;
}
