"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DOMAIN_BY_CODE } from "@/content/domains";
import { activitiesFor } from "@/content/activities";
import { formatAge, summariseAge } from "@/lib/age";
import { DISCLAIMER, domainNote, headline, nextSteps, summary } from "@/lib/narrative";
import { STATUSES, bandForAge, scoreAssessment } from "@/lib/scoring";
import { getAssessment, type StoredAssessment } from "@/lib/store";
import type { Activity, AssessmentResult, DomainScore, Item } from "@/lib/types";
import { AgeComparison, DomainMeter, ProfileRadar } from "@/components/charts";
import {
  Disclaimer,
  DomainDot,
  Shell,
  StatusChip,
  TopBar,
  Wordmark,
  domainColor,
  statusColor,
} from "@/components/ui";

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
            <h1>
              We couldn&rsquo;t find that report
            </h1>
            <p className="mt-2 text-[0.95rem] text-ink-2">
              Reports are saved in this browser only, so a link from another
              device won&rsquo;t open here.
            </p>
            <Link href="/start" className="btn btn-primary mt-6">
              Start a new check
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

  // If nothing needs focus, still suggest play for the two lowest domains —
  // framed as next steps rather than problems.
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
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
              Save as PDF
            </button>
            <Link
              href="/start"
              className="btn btn-primary btn-sm"
            >
              New check
            </Link>
          </div>
        }
      />

      <main className="pb-24">
        <Shell width="wide">
          {/* Print-only masthead, since the top bar is hidden on paper. */}
          <div className="hidden pt-8 print:block">
            <Wordmark />
          </div>

          {/* ── header ────────────────────────────────────────────────── */}
          <header className="border-b border-line pb-7 pt-10">
            <p className="eyebrow eyebrow-accent">
              Development report
            </p>
            <h1 className="display mt-3">
              {child.name}
            </h1>
            <dl className="mt-4 flex flex-wrap gap-x-7 gap-y-2 text-[0.85rem]">
              <div>
                <dt className="inline text-ink-3">Age </dt>
                <dd className="inline font-semibold text-ink-2">
                  {formatAge(age.chronologicalMonths)}
                </dd>
              </div>
              {result.corrected && (
                <div>
                  <dt className="inline text-ink-3">Corrected age </dt>
                  <dd className="inline font-semibold text-ink-2">
                    {formatAge(result.assessedMonths)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="inline text-ink-3">Assessed </dt>
                <dd className="inline font-semibold text-ink-2">
                  {formatDate(record.assessedOn)}
                </dd>
              </div>
              <div>
                <dt className="inline text-ink-3">Questions answered </dt>
                <dd className="inline font-semibold text-ink-2 tabular-nums">
                  {result.answeredCount} of {result.totalCount}
                </dd>
              </div>
            </dl>
          </header>

          {/* ── summary ───────────────────────────────────────────────── */}
          <section className="pt-9">
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

            {/* An uneven profile can show a healthy average beside a cautious
                status. Say why, rather than leaving it looking contradictory. */}
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

            <h2 className="mt-5 max-w-[26ch] text-[1.55rem] sm:text-[1.85rem]">
              {headline(result, child)}
            </h2>

            <div className="prose-read mt-4 max-w-[62ch] space-y-3.5">
              {summary(result, child).map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            </div>
          </section>

          {/* ── charts ────────────────────────────────────────────────── */}
          <section className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-1 eyebrow">
                The shape of {child.name}&rsquo;s development
              </h3>
              <ProfileRadar result={result} />
            </div>
            <div className="card p-5">
              <h3 className="mb-4 eyebrow">
                {result.suppressDq
                  ? "Where each area sits"
                  : "Developmental age, area by area"}
              </h3>
              <AgeComparison result={result} />
            </div>
          </section>

          {/* ── strengths and focus ───────────────────────────────────── */}
          {(result.strengths.length > 0 || result.focusAreas.length > 0) && (
            <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Highlight
                title="Strengths"
                domains={result.strengths}
                empty={`${child.name}'s profile is even across the six areas, with nothing standing out above the rest.`}
                accent="var(--st-on-track)"
              />
              <Highlight
                title="Where to focus"
                domains={result.focusAreas}
                empty="Nothing needs focused attention right now."
                accent="var(--st-emerging)"
              />
            </section>
          )}

          {/* ── domain cards ──────────────────────────────────────────── */}
          <section className="mt-11 print-break">
            <h2>
              Area by area
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.88rem] leading-relaxed text-ink-2">
              What {child.name} is already doing, what is just coming in, and
              what has not arrived yet.
            </p>
            <div className="mt-5 space-y-4">
              {ordered.map((score) => (
                <DomainCard
                  key={score.domain}
                  score={score}
                  note={domainNote(score, child)}
                />
              ))}
            </div>
          </section>

          {/* ── activities ────────────────────────────────────────────── */}
          <section className="mt-11 print-break">
            <h2>
              What to do at home
            </h2>
            <p className="mt-1 max-w-[58ch] text-[0.88rem] leading-relaxed text-ink-2">
              {result.focusAreas.length > 0
                ? `Chosen for the two areas that would benefit most, and pitched at the level ${child.name} is actually working at rather than their age on paper.`
                : `Good next things to play together, pitched just ahead of where ${child.name} is now.`}
            </p>
            <div className="mt-5 space-y-6">
              {activityDomains.map((code) => {
                const score = result.domainScores.find(
                  (d) => d.domain === code,
                )!;
                return (
                  <ActivityGroup
                    key={code}
                    score={score}
                    activities={pickActivities(score)}
                  />
                );
              })}
            </div>
          </section>

          {/* ── next steps ────────────────────────────────────────────── */}
          <section className="mt-11">
            <h2>
              Next steps
            </h2>
            <ul className="mt-4 list-none space-y-3 p-0">
              {nextSteps(result, child).map((s) => (
                <li key={s.slice(0, 30)} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full"
                    style={{ background: "var(--pine)" }}
                  />
                  <span className="text-[0.92rem] leading-relaxed text-ink-2">
                    {s}
                  </span>
                </li>
              ))}
            </ul>
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

function Highlight({
  title,
  domains,
  empty,
  accent,
}: {
  title: string;
  domains: DomainScore["domain"][];
  empty: string;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <h3
        className="eyebrow"
        style={{ color: accent }}
      >
        {title}
      </h3>
      {domains.length === 0 ? (
        <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-3">{empty}</p>
      ) : (
        <ul className="mt-3 list-none space-y-2 p-0">
          {domains.map((code) => (
            <li key={code} className="flex items-center gap-2">
              <DomainDot code={code} />
              <span className="text-[0.95rem] font-semibold text-ink">
                {DOMAIN_BY_CODE[code].name}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DomainCard({ score, note }: { score: DomainScore; note: string }) {
  const domain = DOMAIN_BY_CODE[score.domain];
  return (
    <article className="card overflow-hidden">
      <div
        aria-hidden="true"
        className="h-1 w-full"
        style={{ background: domainColor(score.domain) }}
      />
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-[1.1rem]">
              {domain.name}
            </h3>
            <p className="mt-0.5 text-[0.82rem] text-ink-3">{domain.blurb}</p>
          </div>
          <StatusChip status={score.status} />
        </div>

        <div className="mt-4 max-w-md">
          <DomainMeter score={score} />
        </div>

        <p className="prose-read mt-4 max-w-[62ch] !text-[0.97rem]">{note}</p>
        <p className="mt-2 text-[0.8rem] text-ink-3">
          {STATUSES[score.status].meaning}
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkillList
            label="Already doing"
            items={score.achieved}
            color="var(--st-on-track)"
          />
          <SkillList
            label="Just coming in"
            items={score.emerging}
            color="var(--st-emerging)"
          />
          <SkillList
            label="Not yet"
            items={score.notYet}
            color={statusColor(score.status)}
          />
        </div>
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
  items: Item[];
  color: string;
}) {
  return (
    <div>
      <h4
        className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]"
        style={{ color }}
      >
        {label}{" "}
        <span className="tabular-nums opacity-70">({items.length})</span>
      </h4>
      {items.length === 0 ? (
        <p className="mt-1.5 text-[0.8rem] text-ink-3">&mdash;</p>
      ) : (
        <ul className="mt-1.5 list-none space-y-1.5 p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="text-[0.8rem] leading-snug text-ink-2"
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActivityGroup({
  score,
  activities,
}: {
  score: DomainScore;
  activities: Activity[];
}) {
  const domain = DOMAIN_BY_CODE[score.domain];
  const target = [...score.notYet, ...score.emerging].slice(0, 3);

  return (
    <div>
      <div className="flex items-center gap-2">
        <DomainDot code={score.domain} />
        <h3 className="text-[1.05rem]">{domain.name}</h3>
      </div>

      {target.length > 0 && (
        <p className="mt-1.5 max-w-[60ch] text-[0.83rem] leading-relaxed text-ink-3">
          Working towards:{" "}
          {target.map((t, i) => (
            <span key={t.id}>
              {i > 0 && "; "}
              <span className="text-ink-2">{lowerFirst(t.text)}</span>
            </span>
          ))}
        </p>
      )}

      <ul className="mt-3 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {activities.map((a) => (
          <li key={a.id} className="card p-4">
            <h4 className="text-[0.92rem] font-semibold text-ink">{a.title}</h4>
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-2">
              {a.description}
            </p>
            <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line-soft pt-2.5 text-[0.74rem] text-ink-3">
              <div>
                <dt className="inline">You need: </dt>
                <dd className="inline text-ink-2">{a.materials}</dd>
              </div>
              <div>
                <dt className="inline">Time: </dt>
                <dd className="inline text-ink-2">
                  {a.minutes === 0 ? "As you go" : `${a.minutes} min`}
                </dd>
              </div>
              <div>
                <dt className="inline">How often: </dt>
                <dd className="inline text-ink-2">{a.frequency}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
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

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
