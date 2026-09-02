"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { DOMAIN_BY_CODE, moduleForAge } from "@/content/domains";
import { activitiesFor } from "@/content/activities";
import { formatAge, summariseAge } from "@/lib/age";
import { DISCLAIMER, domainNote, headline, nextSteps, summary } from "@/lib/narrative";
import { STATUSES, bandForAge, scoreAssessment } from "@/lib/scoring";
import { getAssessment, type StoredAssessment } from "@/lib/store";
import type { Activity, AssessmentResult, DomainCode, DomainScore } from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Disclaimer,
  Footer,
  IconArrowRight,
  IconCheck,
  IconDownload,
  IconHeart,
  IconPlay,
  IconSparkle,
  Mascot,
  Meter,
  Section,
  SectionTile,
  Shell,
  StatusChip,
  TopBar,
  Wordmark,
  domainColor,
} from "@/components/ui";

/** A still for each section's suggested video. Real clips drop in later. */
const VIDEO_STILL: Record<DomainCode, string> = {
  vision: "/images/play-blocks.jpg",
  auditory: "/images/baby-laughing.jpg",
  social: "/images/child-smile.jpg",
  mobility: "/images/outdoor-play.jpg",
  language: "/images/parent-reading.jpg",
  hand: "/images/playful-child.jpg",
};

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<StoredAssessment | null | undefined>(undefined);

  useEffect(() => {
    setRecord(getAssessment(id));
  }, [id]);

  const result = useMemo<AssessmentResult | null>(() => {
    if (!record) return null;
    return scoreAssessment({
      child: record.child,
      assessedOn: record.assessedOn,
      responses: record.responses,
      bandsByDomain: record.bandsByDomain,
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
        <TopBar />
        <Shell>
          <p className="pt-24 text-center font-semibold text-ink-3">Building the report…</p>
        </Shell>
      </>
    );
  }

  if (record === null || result === null) {
    return (
      <>
        <TopBar />
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
  const mod = moduleForAge(age.assessedMonths);
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
      <TopBar
        right={
          child.id ? (
            <ButtonLink href={`/children/${child.id}`} variant="ghost" size="sm">
              {child.name}&rsquo;s profile
            </ButtonLink>
          ) : undefined
        }
      />

      <main className="pb-16">
        <Shell width="wide">
          {/* print-only masthead */}
          <div className="hidden pt-6 print:block">
            <Wordmark height={48} />
          </div>

          {/* ══ page 1 · the cover ═══════════════════════════════════════ */}
          <section
            className="relative mt-7 overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-20"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(155deg, var(--brand-600), var(--brand-800))",
              boxShadow: "var(--clay-lg)",
            }}
          >
            <span
              aria-hidden="true"
              className="bloom"
              style={{ width: 340, height: 340, top: -150, left: "8%", "--bloom-color": "#8285f5", opacity: 0.6 } as React.CSSProperties}
            />
            <span
              aria-hidden="true"
              className="bloom"
              style={{ width: 280, height: 280, bottom: -140, right: "8%", "--bloom-color": "#fbbf24", opacity: 0.3 } as React.CSSProperties}
            />

            <div className="relative">
              <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.16em] text-white/70">
                Kaushalya Genius Kid Program
              </p>

              <div className="mt-7 flex justify-center">
                <Avatar name={child.name} photoUrl={child.photoUrl} size={104} ring />
              </div>

              <h1 className="display mt-6 !text-[2.4rem] text-white sm:!text-[3.2rem]">
                {child.name}&rsquo;s Milestone Report
              </h1>

              <dl className="mx-auto mt-8 grid max-w-[46rem] grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                {[
                  ["Age", formatAge(age.chronologicalMonths)],
                  ["Gender", child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—"],
                  ["Assessed on", formatDate(record.assessedOn)],
                  ["Stage", `Module ${mod.id} · ${mod.name}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-white/60">
                      {label}
                    </dt>
                    <dd className="mt-1 text-[0.98rem] font-extrabold text-white">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="no-print mt-10">
                <Button
                  variant="sun"
                  size="lg"
                  onClick={() => window.print()}
                  iconLeft={<IconDownload size={18} />}
                >
                  Download this report
                </Button>
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
              <p className="eyebrow mb-6">Progress, area by area</p>
              <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                {ordered.map((score) => {
                  const d = DOMAIN_BY_CODE[score.domain];
                  const value = score.dq === null ? score.percent * 100 : score.dq;
                  return (
                    <div key={score.domain} className="flex items-center gap-4">
                      <SectionTile code={score.domain} size={46} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[0.95rem] font-extrabold text-ink">
                            {d.name}
                          </span>
                          <span className="tnum text-[0.88rem] font-extrabold text-ink-3">
                            {Math.round(value)}
                          </span>
                        </div>
                        <Meter
                          value={Math.min(100, value)}
                          color={domainColor(score.domain)}
                          className="mt-2"
                          label={`${d.name}: ${Math.round(value)} out of an expected 100`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>

          {/* ══ page 3+ · area by area ═══════════════════════════════════ */}
          <Section size="sm" className="print-break">
            <h2>Area by area</h2>
            <p className="mt-2 max-w-[58ch] text-[0.95rem] leading-relaxed text-ink-2">
              What {child.name} is already doing, what is arriving, and — where it would help —
              a short video to watch together.
            </p>

            <div className="mt-6 space-y-5">
              {ordered.map((score) => (
                <DomainCard
                  key={score.domain}
                  score={score}
                  note={domainNote(score, child)}
                  suggestVideo={focus.includes(score.domain)}
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
                <div className="prose-read space-y-4">
                  {summary(result, child).map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                </div>

                <ul className="mt-7 list-none space-y-3.5 p-0 border-t border-line-soft pt-6">
                  {nextSteps(result, child).map((s) => (
                    <li key={s.slice(0, 30)} className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
                        <IconCheck size={13} />
                      </span>
                      <span className="text-[0.94rem] leading-relaxed text-ink-2">{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* the course recommendation */}
              <Card
                variant="clay"
                className="flex flex-col overflow-hidden"
                style={{ background: "linear-gradient(160deg, var(--sun-100), var(--surface))" }}
              >
                <div className="p-6">
                  <Mascot size={68} mood="wave" className="animate-bob" />
                  <p className="eyebrow mt-4">Recommended next</p>
                  <h3 className="mt-2 text-[1.2rem]">
                    Milestones Acceleration · Phase {mod.phase}
                  </h3>
                  <p className="mt-2.5 text-[0.9rem] leading-relaxed text-ink-2">
                    The Kaushalya 0–6 programme for {mod.name}: day-wise activity plans and short
                    videos across exactly the six areas in this report, ten minutes of screen time
                    and thirty minutes of play a day.
                  </p>

                  <ul className="mt-4 list-none space-y-2 p-0">
                    {["Monthly course for this phase", "Day-wise activity plans", "Milestone checklists"].map(
                      (line) => (
                        <li key={line} className="flex items-center gap-2 text-[0.86rem] font-semibold text-ink-2">
                          <IconCheck size={15} className="text-[var(--st-on-track)]" />
                          {line}
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                <div className="mt-auto space-y-2.5 p-6 pt-0">
                  <ButtonLink
                    href="https://www.kaushalyageniuskid.com"
                    external
                    variant="sun"
                    block
                    iconRight={<IconArrowRight size={17} />}
                  >
                    Explore the programme
                  </ButtonLink>
                  <ButtonLink
                    href="mailto:support@kaushalyageniuskid.com"
                    variant="secondary"
                    block
                    external
                  >
                    Talk to our team
                  </ButtonLink>
                </div>
              </Card>
            </div>
          </Section>

          {/* ══ footer of the document ═══════════════════════════════════ */}
          <Section size="sm">
            <Card variant="clay" className="flex flex-wrap items-center justify-between gap-5 p-6">
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
              <div className="no-print flex flex-wrap gap-2.5">
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

            <div className="mt-8">
              <Disclaimer text={DISCLAIMER} />
              <p className="mt-4 text-[0.74rem] leading-relaxed text-ink-3">
                Milestones adapted from the CDC <em>Learn the Signs. Act Early.</em> checklists, the
                NIDCD hearing and communication checklist, and WHO motor milestone data. Item bank{" "}
                {record.bankVersion}.
              </p>
            </div>
          </Section>
        </Shell>
      </main>

      <Footer />
    </>
  );
}

/* ══ one area ══════════════════════════════════════════════════════════════ */

function DomainCard({
  score,
  note,
  suggestVideo,
  activities,
}: {
  score: DomainScore;
  note: string;
  suggestVideo: boolean;
  activities: Activity[];
}) {
  const domain = DOMAIN_BY_CODE[score.domain];
  const color = domainColor(score.domain);
  const value = score.dq === null ? score.percent * 100 : score.dq;

  return (
    <Card variant="clay" className="overflow-hidden">
      <div aria-hidden="true" className="h-1.5 w-full" style={{ background: color }} />

      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <SectionTile code={score.domain} size={52} />
            <div>
              <h3 className="text-[1.15rem]">{domain.name}</h3>
              <p className="mt-0.5 text-[0.84rem] font-semibold text-ink-3">{domain.blurb}</p>
            </div>
          </div>
          <StatusChip status={score.status} label={STATUSES[score.status].label} />
        </div>

        <div className="mt-5 flex items-center gap-4">
          <Meter value={Math.min(100, value)} color={color} className="flex-1" />
          <span className="tnum text-[0.95rem] font-extrabold text-ink">{Math.round(value)}</span>
        </div>

        <div className={`mt-6 grid gap-6 ${suggestVideo ? "lg:grid-cols-[1fr_16rem]" : ""}`}>
          <div>
            <p className="prose-read !text-[0.97rem]">{note}</p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Doing", n: score.achieved.length, c: "var(--st-on-track)" },
                { label: "Arriving", n: score.emerging.length, c: "var(--st-emerging)" },
                { label: "Not yet", n: score.notYet.length, c: "var(--ink-3)" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-[var(--radius-sm)] px-3 py-2.5"
                  style={{ background: `color-mix(in srgb, ${s.c} 9%, var(--surface-2))` }}
                >
                  <p className="tnum text-[1.3rem] font-extrabold leading-none" style={{ color: s.c }}>
                    {s.n}
                  </p>
                  <p className="mt-1 text-[0.72rem] font-bold text-ink-3">{s.label}</p>
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

          {suggestVideo && (
            <div className="no-print">
              <p className="eyebrow mb-3">Watch together</p>
              <div className="video-thumb">
                <Image
                  src={VIDEO_STILL[score.domain]}
                  alt=""
                  width={480}
                  height={300}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-0" style={{ background: "rgba(23,24,43,0.28)" }} />
                <span className="video-play relative">
                  <IconPlay size={22} />
                </span>
              </div>
              <p className="mt-2.5 text-[0.82rem] font-semibold leading-snug text-ink-2">
                {domain.short} practice for {formatMonths(score.developmentalMonths)}
              </p>
              <Badge className="mt-2">Video coming soon</Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ══ helpers ═══════════════════════════════════════════════════════════════ */

function pickActivities(score: DomainScore): Activity[] {
  const band = bandForAge(Math.round(score.developmentalMonths));
  return activitiesFor(score.domain, band.id).slice(0, 4);
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
