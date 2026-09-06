"use client";

import { Fragment, use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DOMAINS, DOMAIN_BY_CODE } from "@/content/domains";
import { BRAIN_STAGES, STAGE_BY_ID, cellFor } from "@/content/stages";
import { activitiesFor } from "@/content/activities";
import { formatAge, summariseAge } from "@/lib/age";
import { DISCLAIMER, domainNote, headline, nextSteps, summary } from "@/lib/narrative";
import { STATUSES, scoreAssessment } from "@/lib/scoring";
import { stageForAge } from "@/lib/stage";
import { getAssessment, type StoredAssessment } from "@/lib/store";
import type {
  Activity,
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
  IconSparkle,
  Mascot,
  Meter,
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

export function ReportDocument({
  id,
  isAdmin = false,
}: {
  id: string;
  isAdmin?: boolean;
}) {
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<StoredAssessment | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    getAssessment(id).then(found => {
      if (active) setRecord(found);
    });
    return () => { active = false; };
  }, [id]);

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
              Reports are saved in this browser only, so a link from another device won&rsquo;t
              open here.
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

      <main className={`pb-16 ${isAdmin ? "" : ""}`}>
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
                  <p className="text-[0.76rem] font-extrabold uppercase tracking-[0.18em] text-white/65 print:hidden">
                    Kaushalya Genius Kid Program
                  </p>
                  <h1 className="display mt-3 !text-[2.1rem] leading-[1.08] text-white sm:!text-[2.75rem]">
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
                <p className="text-[0.86rem] font-bold text-ink">{child.name}</p>
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
                <span className="text-[0.88rem] font-semibold text-ink-3">
                  Average across the six areas{" "}
                  <strong className="tnum text-[1.05rem] font-extrabold text-ink">
                    {result.overallDq}
                  </strong>{" "}
                  <span className="text-ink-3">(100 is on track for age)</span>
                </span>
              )}
            </div>

            <h2 className="mt-5 max-w-[24ch]">{headline(result, child)}</h2>

            {result.overallRaisedBy && (
              <p className="mt-3 max-w-[62ch] text-[0.92rem] leading-relaxed text-ink-2">
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
              <p className="mb-6 text-[0.82rem] font-medium text-ink-3">
                Where each area sits against the expected stage for {child.name}&rsquo;s age.
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
                          <span className="truncate text-[0.86rem] font-extrabold text-ink">
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
            <p className="mt-2 max-w-[58ch] text-[0.95rem] leading-relaxed text-ink-2">
              The same seven-stage chart the programme uses on paper, filled in with{" "}
              {child.name}&rsquo;s own answers — reflex stage at the bottom, sophisticated
              cortex at the top.
            </p>
            <Card variant="clay" className="mt-6 overflow-hidden !p-0">
              <DevelopmentalProfileChart result={result} childName={child.name} />
            </Card>
          </Section>

          {/* ══ page 3+ · area by area ═══════════════════════════════════ */}
          <Section size="sm" className="print-break">
            <h2>Area by area</h2>
            <p className="mt-2 max-w-[58ch] text-[0.95rem] leading-relaxed text-ink-2">
              What {child.name} is already doing, what is not yet in place, and what to
              practise at home this week.
            </p>

            <div className="mt-6 space-y-5">
              {ordered.map((score) => (
                <DomainCard
                  key={score.domain}
                  score={score}
                  note={domainNote(score, child)}
                  activities={pickActivities(score)}
                />
              ))}
            </div>
          </Section>

          {/* ══ summary & recommendations ════════════════════════════════ */}
          <Section size="sm" className="print-break">
            <h2>Summary &amp; recommendations</h2>

            <div className="mt-5 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <Card variant="clay" className="p-6 sm:p-8">
                <SummaryProse result={result} child={child} />

                <div className="mt-7 border-t border-line-soft pt-6">
                  <p className="eyebrow mb-4">What to do next</p>
                  <ul className="list-none space-y-3.5 p-0">
                    {nextSteps(result, child).map((s) => (
                      <li key={s.slice(0, 30)} className="flex items-start gap-3">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
                          <IconCheck size={13} />
                        </span>
                        <span className="text-[0.94rem] leading-relaxed text-ink-2">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <DefaultRecommendationCard stage={startStage} />
            </div>
          </Section>

          {/* ══ footer of the document ═══════════════════════════════════ */}
          <Section size="sm">
            <Card variant="clay" className="no-print flex flex-wrap items-center justify-between gap-5 p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-[var(--st-consult-soft)] text-[var(--st-consult)]">
                  <IconHeart size={20} />
                </span>
                <div>
                  <p className="text-[0.98rem] font-extrabold text-ink">Keep this report</p>
                  <p className="text-[0.84rem] font-semibold text-ink-3">
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
              <p className="mt-4 text-[0.74rem] leading-relaxed text-ink-3">
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
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-line-soft px-5 py-3.5 text-[0.78rem] font-semibold text-ink-3 sm:px-7">
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

      <p className="border-t border-line-soft px-5 py-3.5 text-[0.78rem] leading-relaxed text-ink-3 sm:px-7">
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
function SummaryProse({ result, child }: { result: AssessmentResult; child: Child }) {
  const [context, ...verdict] = summary(result, child);

  const terms = [
    child.name,
    ...DOMAINS.map((d) => d.name.toLowerCase()),
    STATUSES[result.overallStatus].label.toLowerCase(),
  ];

  return (
    <div>
      {context && (
        <p className="flex items-start gap-2 text-[0.86rem] font-semibold leading-relaxed text-ink-3">
          <IconCalendar size={15} className="mt-0.5 shrink-0" />
          {context}
        </p>
      )}

      <div
        className="mt-5 space-y-4 rounded-r-[var(--radius-sm)] py-1 pl-5 sm:pl-6"
        style={{ borderLeft: `3px solid ${statusColor(result.overallStatus)}` }}
      >
        {verdict.map((p) => (
          <p key={p.slice(0, 40)} className="text-[1.02rem] leading-[1.75] text-ink-2">
            <Highlight text={p} terms={terms} />
          </p>
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
  activities,
}: {
  score: DomainScore;
  note: string;
  activities: Activity[];
}) {
  const domain = DOMAIN_BY_CODE[score.domain];
  const color = domainColor(score.domain);
  const value = score.dq === null ? score.percent * 100 : score.dq;
  // Open by default for the areas actually worth reading about; collapsed
  // for the ones that are already fine, so six full-length cards don't force
  // a long scroll past detail nobody needs yet. The status chip, score and
  // blurb stay visible either way, in the summary row.
  const defaultOpen = score.status === "mild" || score.status === "delay" || score.status === "significant";

  const levels = [
    {
      key: "achieved",
      label: "Doing",
      n: score.achieved.length,
      tone: "var(--st-on-track)",
      icon: <IconCheck size={12} />,
    },
    {
      key: "notYet",
      label: "Not yet",
      n: score.notYet.length,
      tone: "var(--ink-3)",
      icon: <IconClock size={12} />,
    },
  ] as const;

  return (
    <Card variant="clay" className="overflow-hidden">
      <div aria-hidden="true" className="h-1.5 w-full" style={{ background: color }} />

      {/* A dropdown rather than a fixed block: the status chip, score and
          blurb below are enough to read this area at a glance, so the full
          breakdown — what to work on, activities, video — only costs a click
          when it's wanted. Printing/downloading still gets everything: see
          the "print: force every <details> open" rule in globals.css. */}
      <details className="group/domain" open={defaultOpen}>
        <summary className="report-domain-summary cursor-pointer list-none p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <SectionTile code={score.domain} size={52} />
              <div>
                <h3 className="text-[1.15rem]">{domain.name}</h3>
                <p className="mt-0.5 text-[0.84rem] font-semibold text-ink-3">{domain.blurb}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusChip status={score.status} label={STATUSES[score.status].label} />
              <span
                aria-hidden="true"
                className="no-print grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-ink-3 transition-transform group-open/domain:rotate-90"
              >
                <IconChevronRight size={16} />
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <Meter value={Math.min(100, value)} color={color} className="flex-1" animate />
            <span className="tnum text-[0.95rem] font-extrabold text-ink">{Math.round(value)}</span>
          </div>
        </summary>

        <div
          className="border-t border-line-soft p-6 sm:p-7"
        >
          <div>
            <p className="prose-read !text-[0.97rem]">{note}</p>

            <p className="eyebrow mb-2.5 mt-6">Where they stand, item by item</p>
            <div className="grid grid-cols-3 gap-2.5">
              {levels.map((l) => (
                <div
                  key={l.key}
                  className="level-cell"
                  style={{ "--tone": l.tone } as React.CSSProperties}
                >
                  <span className="level-cell-icon">{l.icon}</span>
                  <p className="tnum level-cell-count">{l.n}</p>
                  <p className="level-cell-label">{l.label}</p>
                </div>
              ))}
            </div>

            {activities.length > 0 && (
              <div className="mt-6 border-t border-line-soft pt-5">
                <p className="eyebrow mb-3">Try at home this week</p>
                <ul className="grid list-none gap-3 p-0 sm:grid-cols-2">
                  {activities.slice(0, 2).map((a) => (
                    <li
                      key={a.id}
                      className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] p-4"
                    >
                      <p className="text-[0.9rem] font-extrabold text-ink">{a.title}</p>
                      <p className="mt-1.5 text-[0.83rem] leading-relaxed text-ink-2">
                        {a.description}
                      </p>
                      <p className="mt-2.5 flex items-center gap-1.5 text-[0.74rem] font-bold text-ink-3">
                        <IconSparkle size={13} />
                        {a.minutes === 0 ? "As you go" : `${a.minutes} min`} · {a.frequency}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </details>
    </Card>
  );
}

/* ══ recommendation ═══════════════════════════════════════════════════════
 * A single fixed card pointing at the programme. The admin-authored course +
 * rule engine that used to feed an alternative version of this was removed
 * along with the Courses admin section — it produced nothing a hardcoded CTA
 * doesn't, and every deployment had zero courses in it. */

function RecommendationShell({
  eyebrow,
  title,
  description,
  bullets,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  primaryHref?: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <Card
      variant="clay"
      className="recommend-card flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, var(--sun-100), var(--surface))" }}
    >
      <div className="p-6">
        <Mascot size={68} mood="wave" className="no-print" />
        <p className="eyebrow mt-4">{eyebrow}</p>
        <h3 className="mt-2 text-[1.2rem]">{title}</h3>
        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-2">{description}</p>

        {bullets.length > 0 && (
          <ul className="mt-4 list-none space-y-2 p-0">
            {bullets.map((line) => (
              <li key={line} className="flex items-center gap-2 text-[0.86rem] font-semibold text-ink-2">
                <IconCheck size={15} className="text-[var(--st-on-track)]" />
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="no-print mt-auto space-y-2.5 p-6 pt-0">
        {primaryHref && (
          <ButtonLink href={primaryHref} external variant="sun" block iconRight={<IconArrowRight size={17} />}>
            {primaryLabel}
          </ButtonLink>
        )}
        <ButtonLink href={secondaryHref} variant="secondary" block external>
          {secondaryLabel}
        </ButtonLink>
      </div>

      {/* Buttons don't work on paper — a printed report gets the plain
          addresses instead, written out in full. */}
      <dl className="hidden print:block print:space-y-2 print:border-t print:border-line-soft print:p-6 print:pt-4 print:text-[9.5pt]">
        {primaryHref && (
          <div>
            <dt className="inline font-bold">{primaryLabel}: </dt>
            <dd className="inline">{primaryHref.replace(/^https?:\/\//, "")}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-bold">{secondaryLabel}: </dt>
          <dd className="inline">{secondaryHref.replace(/^mailto:/, "")}</dd>
        </div>
      </dl>
    </Card>
  );
}

function DefaultRecommendationCard({ stage }: { stage: BrainStage }) {
  return (
    <RecommendationShell
      eyebrow="Recommended next"
      title={`Milestones Acceleration · Stage ${stage.roman}`}
      description={`The Kaushalya 0–6 programme for ${stage.name}: day-wise activity plans and short videos across exactly the six areas in this report, ten minutes of screen time and thirty minutes of play a day.`}
      bullets={["Monthly course for this phase", "Day-wise activity plans", "Milestone checklists"]}
      primaryHref="https://www.kaushalyageniuskid.com"
      primaryLabel="Explore the programme"
      secondaryHref="mailto:support@kaushalyageniuskid.com"
      secondaryLabel="Talk to our team"
    />
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

/**
 * Activities are picked from the stage the child actually reached, not the one
 * their age points at. A child working at stage III needs stage III play, and
 * handing them their age's activities is how a report becomes discouraging.
 */
function pickActivities(score: DomainScore): Activity[] {
  return activitiesFor(score.domain, score.achievedStage || "s1").slice(0, 4);
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
