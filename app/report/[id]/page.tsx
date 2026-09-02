"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DOMAIN_BY_CODE } from "@/content/domains";
import { activitiesFor } from "@/content/activities";
import { formatAge, summariseAge } from "@/lib/age";
import { DISCLAIMER, domainNote, headline, nextSteps, summary } from "@/lib/narrative";
import { STATUSES, bandForAge, scoreAssessment } from "@/lib/scoring";
import { getAssessment, type StoredAssessment } from "@/lib/store";
import type { Activity, AssessmentResult, DomainScore } from "@/lib/types";
import {
  Avatar,
  Disclaimer,
  DomainDot,
  Shell,
  StatusChip,
  TopBar,
  Wordmark,
  domainColor,
} from "@/components/ui";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const [record, setRecord] = useState<StoredAssessment | null | undefined>(
    undefined,
  );

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

  // Lets a parent land here with ?download=1 (e.g. from the child profile
  // page) and get the print dialogue straight away, without another click.
  useEffect(() => {
    if (result && searchParams.get("download") === "1") {
      const t = window.setTimeout(() => window.print(), 350);
      return () => window.clearTimeout(t);
    }
  }, [result, searchParams]);

  if (record === undefined) {
    return (
      <>
        <TopBar />
        <Shell>
          <p className="pt-24 text-center text-[0.9rem] text-ink-3">
            Building the report&hellip;
          </p>
        </Shell>
      </>
    );
  }

  if (record === null || result === null) {
    return (
      <>
        <TopBar />
        <Shell>
          <div className="pt-20">
            <h1>We couldn&rsquo;t find that report</h1>
            <p className="mt-2 text-[0.95rem] text-ink-2">
              Reports are saved in this browser only, so a link from another
              device won&rsquo;t open here.
            </p>
            <Link href="/children" className="btn btn-primary mt-6">
              Go to your children
            </Link>
          </div>
        </Shell>
      </>
    );
  }

  const child = record.child;
  const age = summariseAge(child.dob, record.assessedOn, child.gestationalWeeks);
  const ordered = [...result.domainScores].sort(
    (a, b) => DOMAIN_BY_CODE[a.domain].order - DOMAIN_BY_CODE[b.domain].order,
  );

  // If nothing needs focus, still suggest play (and a video) for the two
  // lowest sections — framed as next steps rather than problems.
  const metric = (d: DomainScore) => (d.dq === null ? d.percent * 100 : d.dq);
  const activityDomains =
    result.focusAreas.length > 0
      ? result.focusAreas
      : [...result.domainScores]
          .sort((a, b) => metric(a) - metric(b))
          .slice(0, 2)
          .map((d) => d.domain);

  return (
    <>
      <TopBar
        right={
          <Link href={`/children/${child.id}`} className="btn btn-ghost btn-sm">
            {child.name}&rsquo;s profile
          </Link>
        }
      />

      <main className="pb-24">
        <Shell width="wide">
          {/* Print-only masthead, since the top bar is hidden on paper. */}
          <div className="hidden pt-8 print:block">
            <Wordmark />
          </div>

          {/* ── page 1 · cover ────────────────────────────────────────── */}
          <section className="card card-pastel-blue animate-rise mt-8 flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <p className="eyebrow eyebrow-accent">Kaushalya Genius Kid Program</p>
            <Avatar name={child.name} size={72} />
            <h1 className="display mt-5 !text-[2.1rem] sm:!text-[2.6rem]">
              {child.name}&rsquo;s Report
            </h1>
            <dl className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[0.88rem]">
              <Field label="Age" value={formatAge(age.chronologicalMonths)} />
              <Field
                label="Gender"
                value={child.gender === "girl" ? "Girl" : child.gender === "boy" ? "Boy" : "—"}
              />
              <Field label="Assessed on" value={formatDate(record.assessedOn)} />
              <Field label="Assessment" value="Genius Milestones Check" />
            </dl>

            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-primary mt-9"
            >
              <DownloadIcon /> Download report
            </button>
          </section>

          {/* ── page 2 · progress overview ───────────────────────────── */}
          <section className="mt-11 print-break">
            <div className="flex flex-wrap items-center gap-3">
              <StatusChip status={result.overallStatus} solid />
              {!result.suppressDq && result.overallDq !== null && (
                <span className="text-[0.82rem] text-ink-3">
                  Average across the six areas{" "}
                  <strong className="font-semibold tabular-nums text-ink">
                    {result.overallDq}
                  </strong>{" "}
                  <span className="text-ink-3">(100 is on track for age)</span>
                </span>
              )}
            </div>

            {result.overallRaisedBy && (
              <p className="mt-2.5 max-w-[58ch] text-[0.84rem] leading-relaxed text-ink-2">
                The average looks healthy because most areas are strong. We have
                still flagged this report as{" "}
                <strong className="font-semibold">
                  {STATUSES[result.overallStatus].label.toLowerCase()}
                </strong>{" "}
                because{" "}
                <strong className="font-semibold">
                  {DOMAIN_BY_CODE[result.overallRaisedBy].name.toLowerCase()}
                </strong>{" "}
                needs attention on its own, and an average can hide that.
              </p>
            )}

            <h2 className="mt-5 max-w-[28ch] text-[1.55rem] sm:text-[1.85rem]">
              {headline(result, child)}
            </h2>

            <div className="card mt-7 p-6">
              <h3 className="eyebrow mb-5">Progress, area by area</h3>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {ordered.map((score) => (
                  <BigMeter key={score.domain} score={score} />
                ))}
              </div>
            </div>
          </section>

          {/* ── page 3+ · area by area ────────────────────────────────── */}
          <section className="mt-11 print-break">
            <h2>Area by area</h2>
            <p className="mt-1 max-w-[58ch] text-[0.88rem] leading-relaxed text-ink-2">
              What {child.name} is already doing, and simple videos to try where
              a little more practice would help.
            </p>
            <div className="mt-5 space-y-4">
              {ordered.map((score) => (
                <DomainCard
                  key={score.domain}
                  score={score}
                  note={domainNote(score, child)}
                  suggestVideo={result.focusAreas.includes(score.domain)}
                  activities={pickActivities(score)}
                />
              ))}
            </div>
          </section>

          {/* ── summary & recommendations ─────────────────────────────── */}
          <section className="mt-11 print-break">
            <h2>Summary & recommendations</h2>
            <div className="prose-read mt-4 max-w-[62ch] space-y-3.5">
              {summary(result, child).map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>

            <ul className="mt-6 list-none space-y-3 p-0">
              {nextSteps(result, child).map((s) => (
                <li key={s.slice(0, 30)} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                  <span className="text-[0.92rem] leading-relaxed text-ink-2">
                    {s}
                  </span>
                </li>
              ))}
            </ul>

            <div className="card card-pastel-green mt-8 !p-6">
              <h3 className="text-[1.05rem]">Recommended next: Milestones Acceleration</h3>
              <p className="mt-2 max-w-[58ch] text-[0.88rem] leading-relaxed text-ink-2">
                Kaushalya&rsquo;s 0–6 years programme (Stage 3) is built around exactly the six areas
                in this report, delivered in short daily activities matched to {child.name}&rsquo;s
                own pace.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="https://www.kaushalyageniuskid.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                >
                  Explore the programme
                </a>
                <a href="mailto:support@kaushalyageniuskid.com" className="btn btn-ghost">
                  Talk to our team
                </a>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <Disclaimer text={DISCLAIMER} />
            <p className="mt-4 text-[0.72rem] leading-relaxed text-ink-3">
              Milestones adapted from the CDC <em>Learn the Signs. Act Early.</em>{" "}
              checklists, the NIDCD hearing and communication checklist, and WHO
              motor milestone data. Item bank {record.bankVersion}.
            </p>
          </section>
        </Shell>
      </main>
    </>
  );
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-0.5 text-[0.98rem] font-semibold text-ink">{value}</dd>
    </div>
  );
}

function BigMeter({ score }: { score: DomainScore }) {
  const domain = DOMAIN_BY_CODE[score.domain];
  const value = score.dq === null ? score.percent * 100 : score.dq;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 text-[0.9rem] font-semibold text-ink">
          <DomainDot code={score.domain} />
          {domain.name}
        </span>
        <span className="tabular-nums text-[0.8rem] text-ink-3">
          {Math.round(value)}
        </span>
      </div>
      <div className="meter-track mt-2">
        <div
          className="meter-fill"
          style={{
            width: `${Math.min(100, value)}%`,
            background: domainColor(score.domain),
          }}
        />
      </div>
    </div>
  );
}

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
  return (
    <article className="card overflow-hidden">
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{ background: domainColor(score.domain) }}
      />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[1.1rem]">
              {domain.name}
              {domain.placeholder && (
                <span className="chip ml-2 align-middle !text-[0.62rem]">Content pending</span>
              )}
            </h3>
          </div>
          <StatusChip status={score.status} />
        </div>

        <div className="mt-4 max-w-md">
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, score.dq === null ? score.percent * 100 : score.dq)}%`,
                background: "var(--accent)",
              }}
            />
          </div>
        </div>

        <p className="prose-read mt-4 max-w-[62ch] !text-[0.97rem]">{note}</p>

        <div
          className={`mt-5 grid grid-cols-1 gap-5 ${suggestVideo ? "sm:grid-cols-[1fr_13rem]" : ""}`}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkillList label="Doing" items={score.achieved.length} color="var(--st-on-track)" />
            <SkillList label="Coming in" items={score.emerging.length} color="var(--st-emerging)" />
            <SkillList label="Not yet" items={score.notYet.length} color="var(--ink-3)" />
          </div>

          {suggestVideo && (
            <VideoSuggestion title={`${domain.short} practice with ${activities[0]?.title ?? "a fun activity"}`} />
          )}
        </div>

        {activities.length > 0 && (
          <div className="mt-5 border-t border-line-soft pt-4">
            <h4 className="eyebrow">Try at home</h4>
            <ul className="mt-3 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {activities.slice(0, 2).map((a) => (
                <li key={a.id} className="rounded-[var(--radius-sm)] bg-surface-2 p-3.5">
                  <h5 className="text-[0.88rem] font-semibold text-ink">{a.title}</h5>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-ink-2">{a.description}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

function SkillList({
  label,
  items,
  color,
}: {
  label: string;
  items: number;
  color: string;
}) {
  return (
    <div>
      <h4
        className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]"
        style={{ color }}
      >
        {label}
      </h4>
      <p className="mt-1 text-[1.15rem] font-bold tabular-nums text-ink">{items}</p>
    </div>
  );
}

/** Thumbnail + play button placeholder — real videos to be added later. */
function VideoSuggestion({ title }: { title: string }) {
  return (
    <div className="no-print">
      <div className="video-thumb">
        <span className="video-play">
          <PlayIcon />
        </span>
      </div>
      <p className="mt-1.5 text-[0.76rem] leading-snug text-ink-3">{title}</p>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M6.5 4.5v11l9-5.5-9-5.5Z" fill="currentColor" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3v9.5m0 0 3.5-3.5M10 12.5 6.5 9M4 15.5h12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── helpers ────────────────────────────────────────────────────────────── */

/**
 * Activities are picked for where the child actually is, not their age on
 * paper. A four-year-old whose language sits at a thirty-month level gets
 * thirty-month language play, which is the level that will actually move.
 */
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
