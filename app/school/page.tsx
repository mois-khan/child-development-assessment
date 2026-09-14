"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { useAuth } from "@/lib/auth/provider";
import { itemBankReady, primeItemBank } from "@/lib/item-bank";
import { phaseLabel } from "@/lib/naming";
import { scoreAssessment } from "@/lib/scoring";
import { stageForAge } from "@/lib/stage";
import { listAssessments, listChildren, type SavedChild, type StoredAssessment } from "@/lib/store";
import type { AssessmentResult, StatusCode } from "@/lib/types";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Card,
  Footer,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconPlus,
  IconSchool,
  IconStarFilled,
  LoadError,
  Section,
  Shell,
  TopBar,
  statusColor,
} from "@/components/ui";

/* ── what this page is ───────────────────────────────────────────────────────
 * A school's home. Same job as /dashboard, different owner: instead of one
 * family, it's a roster — every student the school has added, with the same
 * per-child status a parent's dashboard shows, because the underlying data
 * IS the same shape (a school's students are just children rows it owns —
 * see 0007_schools.sql). What's cut is anything that assumes one family:
 * the six-areas strip aggregates across a parent's few children into
 * something readable; across a roster of dozens it would just be noise.
 * ────────────────────────────────────────────────────────────────────────── */

interface StudentSummary {
  child: SavedChild;
  ageMonths: number;
  phase: ReturnType<typeof stageForAge>;
  completedCount: number;
  inProgress: StoredAssessment | null;
  latest: { assessment: StoredAssessment; result: AssessmentResult } | null;
}

export default function SchoolDashboardPage() {
  const { profile, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<SavedChild[] | null>(null);
  const [assessments, setAssessments] = useState<StoredAssessment[] | null>(null);
  const [bankReady, setBankReady] = useState(itemBankReady());
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    primeItemBank().finally(() => active && setBankReady(true));

    Promise.all([listChildren(), listAssessments()])
      .then(([kids, checks]) => {
        if (!active) return;
        setChildren(kids);
        setAssessments(checks);
      })
      .catch(() => active && setFailed(true));

    return () => {
      active = false;
    };
  }, [attempt]);

  const loading = authLoading || children === null || assessments === null || !bankReady;

  const summaries = useMemo<StudentSummary[]>(() => {
    if (!children || !assessments || !bankReady) return [];
    const today = todayISO();

    return children
      .map((child) => {
        const mine = assessments.filter((a) => a.child.id === child.id);
        const completed = mine
          .filter((a) => a.completedAt)
          .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
        const age = summariseAge(child.dob, today, child.gestationalWeeks);

        let latest: StudentSummary["latest"] = null;
        if (completed[0]) {
          try {
            latest = {
              assessment: completed[0],
              result: scoreAssessment({
                child: completed[0].child,
                assessedOn: completed[0].assessedOn,
                responses: completed[0].responses,
                details: completed[0].details,
                stagesByDomain: completed[0].stagesByDomain,
              }),
            };
          } catch {
            latest = null;
          }
        }

        return {
          child,
          ageMonths: age.chronologicalMonths,
          phase: stageForAge(age.assessedMonths),
          completedCount: completed.length,
          inProgress: mine.find((a) => !a.completedAt) ?? null,
          latest,
        };
      })
      // Whoever needs attention first: an unfinished check outranks a
      // finished one, and within a group the most recently touched student
      // sorts first — a roster is worked top-down, not alphabetically.
      .sort((a, b) => {
        if (!!a.inProgress !== !!b.inProgress) return a.inProgress ? -1 : 1;
        const at = a.latest?.assessment.completedAt ?? a.child.createdAt ?? "";
        const bt = b.latest?.assessment.completedAt ?? b.child.createdAt ?? "";
        return bt.localeCompare(at);
      });
  }, [children, assessments, bankReady]);

  const totals = useMemo(() => {
    const reportsReady = summaries.filter((s) => s.completedCount > 0).length;
    const inProgress = summaries.filter((s) => s.inProgress).length;
    return { students: summaries.length, reportsReady, inProgress };
  }, [summaries]);

  const schoolName = profile?.school?.name || "Your school";

  if (failed) {
    return (
      <>
        <TopBar />
        <Shell width="narrow">
          <LoadError onRetry={() => setAttempt((n) => n + 1)} />
        </Shell>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopBar
        right={
          <ButtonLink href="/children?new=1" size="sm" iconLeft={<IconPlus size={16} />}>
            Add a student
          </ButtonLink>
        }
      />

      <main className="pb-4">
        {/* ══ greeting ═════════════════════════════════════════════════════ */}
        <Shell width="wide">
          <div
            className="relative mt-7 overflow-hidden px-6 py-8 sm:px-10 sm:py-10"
            style={{
              borderRadius: "var(--radius-xl)",
              background:
                "linear-gradient(135deg, var(--sec-language) 0%, var(--brand-500) 55%, var(--sec-visual) 100%)",
              boxShadow:
                "0 2px 5px rgba(69, 77, 93, 0.14), 0 40px 70px -28px color-mix(in srgb, var(--brand-600) 60%, transparent)",
            }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full"
              style={{ background: "var(--sun-300)", opacity: 0.18 }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-14 left-[38%] size-48 rounded-full"
              style={{ background: "var(--coral-300)", opacity: 0.12 }}
            />

            <div className="relative flex flex-wrap items-center justify-between gap-8">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <h1 className="mt-2 text-white">{schoolName}</h1>
                {!loading && (
                  <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-white/80">
                    {totals.students === 0
                      ? "Add your first student and we'll work out exactly which of the seven phases they're on."
                      : totals.inProgress > 0
                        ? `${totals.inProgress} check${totals.inProgress === 1 ? "" : "s"} part-way through; pick up where a student stopped.`
                        : `${totals.reportsReady} of ${totals.students} students have a report ready.`}
                  </p>
                )}

                {!loading && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <ButtonLink
                      href={totals.students === 0 ? "/children?new=1" : "/children"}
                      variant="sun"
                      iconRight={<IconArrowRight size={17} />}
                    >
                      {totals.students === 0 ? "Add your first student" : "Manage roster"}
                    </ButtonLink>
                    <Link
                      href="/children"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      Full student list
                      <IconChevronRight size={15} />
                    </Link>
                  </div>
                )}
              </div>

              <span
                aria-hidden="true"
                className="hidden shrink-0 grid size-24 place-items-center rounded-3xl bg-white/15 text-white sm:grid"
              >
                <IconSchool size={44} />
              </span>
            </div>
          </div>
        </Shell>

        {/* ══ the numbers ══════════════════════════════════════════════════ */}
        <Shell width="wide">
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-[124px] animate-pulse rounded-2xl bg-surface-3" />
              ))
            ) : (
              <>
                <StatTile
                  value={totals.students}
                  label={totals.students === 1 ? "Student" : "Students"}
                  icon={<IconStarFilled size={19} />}
                  gradient="linear-gradient(135deg, var(--brand-600), var(--brand-500))"
                  href="/children"
                />
                <StatTile
                  value={totals.reportsReady}
                  label="Reports ready"
                  icon={<IconCheck size={19} />}
                  gradient="linear-gradient(135deg, var(--st-on-track), var(--sec-language))"
                  href="/children"
                />
                <StatTile
                  value={totals.inProgress}
                  label="In progress"
                  icon={<IconClock size={19} />}
                  gradient="linear-gradient(135deg, var(--sun-500), var(--coral-500))"
                  href="/children"
                />
              </>
            )}
          </div>
        </Shell>

        {/* ══ roster ═══════════════════════════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex items-center justify-between gap-4">
              <h2 className="!text-xl">Roster</h2>
              {!loading && summaries.length > 0 && (
                <Badge tone="neutral">
                  {summaries.length} {summaries.length === 1 ? "student" : "students"}
                </Badge>
              )}
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-surface-3" />
                  ))}
                </div>
              ) : summaries.length === 0 ? (
                <Card variant="clay" className="flex flex-col items-center gap-4 py-12 text-center">
                  <span className="grid size-16 place-items-center rounded-full bg-[var(--accent-soft)] text-accent">
                    <IconSchool size={30} />
                  </span>
                  <div>
                    <p className="text-lg font-extrabold text-ink">No students yet</p>
                    <p className="mt-1 max-w-[36ch] text-sm text-ink-3">
                      Add your first student and their guardian&rsquo;s email, that&rsquo;s all it
                      takes to start their first check.
                    </p>
                  </div>
                  <ButtonLink href="/children?new=1" iconRight={<IconArrowRight size={17} />}>
                    Add a student
                  </ButtonLink>
                </Card>
              ) : (
                <div className="space-y-3">
                  {summaries.map((s) => (
                    <StudentRow key={s.child.id} summary={s} />
                  ))}
                </div>
              )}
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}

function StatTile({
  value,
  label,
  icon,
  gradient,
  href,
  hint,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  href: string;
  hint?: string;
}) {
  return (
    <Link
      href={href}
      title={hint ? `${label}: ${hint}` : undefined}
      aria-label={hint ? `${label}: ${value}. ${hint}.` : undefined}
      className="lift relative block overflow-hidden rounded-2xl px-5 py-6 text-white transition-transform"
      style={{ background: gradient }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/10"
      />
      <span className="relative grid size-9 place-items-center rounded-xl bg-white/20">{icon}</span>
      <p
        className="tnum relative mt-3 text-3xl font-extrabold leading-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className="relative mt-1.5 text-xs font-bold text-white/75">{label}</p>
    </Link>
  );
}

function StudentRow({ summary }: { summary: StudentSummary }) {
  const { child, ageMonths, phase, completedCount, inProgress, latest } = summary;
  const status: StatusCode | null = latest?.result.overallStatus ?? null;

  return (
    <Card variant="clay" className="flex items-center gap-4 !p-4 sm:!p-5">
      <span
        aria-hidden="true"
        className="hidden h-12 w-1.5 shrink-0 rounded-full sm:block"
        style={{ background: status ? statusColor(status) : "var(--accent-line)" }}
      />
      <Avatar name={child.name} photoUrl={child.photoUrl} size={50} ring />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-base font-extrabold text-ink">{child.name}</p>
          <Badge tone="accent">{phaseLabel(phase)}</Badge>
        </div>
        <p className="text-sm font-semibold text-ink-3">
          {formatAge(ageMonths)}
          {child.parentEmail && <span className="font-normal text-ink-3"> · {child.parentEmail}</span>}
        </p>
      </div>

      <div className="shrink-0">
        {inProgress ? (
          <ButtonLink href={`/assessment/${inProgress.id}`} size="sm" iconLeft={<IconBolt size={15} />}>
            Resume
          </ButtonLink>
        ) : completedCount > 0 ? (
          <ButtonLink href={`/children/${child.id}`} variant="secondary" size="sm" iconRight={<IconArrowRight size={15} />}>
            View report
          </ButtonLink>
        ) : (
          <ButtonLink href={`/children/${child.id}/pay`} variant="secondary" size="sm" iconRight={<IconArrowRight size={15} />}>
            Start check
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
