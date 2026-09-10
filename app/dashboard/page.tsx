"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DOMAINS } from "@/content/domains";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { useAuth } from "@/lib/auth/provider";
import { itemBankReady, primeItemBank } from "@/lib/item-bank";
import { phaseLabel } from "@/lib/naming";
import { STATUSES, scoreAssessment } from "@/lib/scoring";
import { stageForAge } from "@/lib/stage";
import { listAssessments, listChildren, type SavedChild, type StoredAssessment } from "@/lib/store";
import type { AssessmentResult, DomainCode, StatusCode } from "@/lib/types";
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  Footer,
  IconArrowRight,
  IconBolt,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconDownload,
  IconPlus,
  IconSparkle,
  IconStarFilled,
  IconTrophy,
  LoadError,
  Mascot,
  Meter,
  ProgressRing,
  Section,
  SectionTile,
  Shell,
  StatusChip,
  TopBar,
  domainColor,
  domainName,
  statusColor,
  statusSoft,
} from "@/components/ui";

/* ── what this page is ───────────────────────────────────────────────────────
 * The signed-in parent's home. "/" is a pitch; this is the product.
 *
 * It answers, in this order, the four questions a parent actually arrives
 * with: is anything half-finished, how are my children doing, what should I
 * do next, and where are my reports. Everything else — the six competences,
 * the programme — sits below that fold as context, not as the lead.
 * ────────────────────────────────────────────────────────────────────────── */

interface ChildSummary {
  child: SavedChild;
  ageMonths: number;
  phase: ReturnType<typeof stageForAge>;
  completed: StoredAssessment[];
  inProgress: StoredAssessment | null;
  latest: { assessment: StoredAssessment; result: AssessmentResult } | null;
}

export default function DashboardPage() {
  const { profile, user, loading: authLoading } = useAuth();

  const [children, setChildren] = useState<SavedChild[] | null>(null);
  const [assessments, setAssessments] = useState<StoredAssessment[] | null>(null);
  const [bankReady, setBankReady] = useState(itemBankReady());
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    // The question bank has to be in memory before scoreAssessment() runs, or
    // the dashboard would grade against the shipped bank while the report
    // grades against the live one — same child, two different verdicts.
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

  const summaries = useMemo<ChildSummary[]>(() => {
    if (!children || !assessments || !bankReady) return [];
    const today = todayISO();

    return children.map((child) => {
      const mine = assessments.filter((a) => a.child.id === child.id);
      const completed = mine
        .filter((a) => a.completedAt)
        .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
      const age = summariseAge(child.dob, today, child.gestationalWeeks);

      let latest: ChildSummary["latest"] = null;
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
          // A single unscoreable record must not blank the whole dashboard —
          // the card falls back to "report ready" without the score ring.
          latest = null;
        }
      }

      return {
        child,
        ageMonths: age.chronologicalMonths,
        phase: stageForAge(age.assessedMonths),
        completed,
        inProgress: mine.find((a) => !a.completedAt) ?? null,
        latest,
      };
    });
  }, [children, assessments, bankReady]);

  const totals = useMemo(() => {
    const done = summaries.reduce((n, s) => n + s.completed.length, 0);
    const open = summaries.filter((s) => s.inProgress).length;
    const scored = summaries.filter((s) => s.latest?.result.overallDq != null);
    const avgDq = scored.length
      ? Math.round(scored.reduce((n, s) => n + (s.latest!.result.overallDq ?? 0), 0) / scored.length)
      : null;
    return { children: summaries.length, done, open, avgDq };
  }, [summaries]);

  const resumable = summaries.filter((s) => s.inProgress);
  const firstName = (profile?.fullName || user?.email || "there").split(/[\s@]/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

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
          <ButtonLink href="/children" size="sm" iconLeft={<IconPlus size={16} />}>
            Add a child
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
                "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 52%, var(--coral-500) 100%)",
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
                <h1 className="mt-2 text-white">
                  {greeting}, {firstName}.
                </h1>
                {!loading && (
                  <p className="mt-2 max-w-[46ch] text-base leading-relaxed text-white/80">
                    {totals.children === 0
                      ? "Add your child and we'll work out exactly which of the seven phases they're on."
                      : resumable.length > 0
                        ? `${resumable[0].child.name}'s check is part-way through — pick it up where you stopped.`
                        : totals.done === 0
                          ? "Everything's set up. A calm ten minutes is all the first check takes."
                          : `${totals.done} check${totals.done === 1 ? "" : "s"} saved across your family.`}
                  </p>
                )}

                {!loading && (
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {totals.children === 0 ? (
                      <ButtonLink
                        href="/children"
                        variant="sun"
                        iconRight={<IconArrowRight size={17} />}
                      >
                        Add your first child
                      </ButtonLink>
                    ) : resumable.length > 0 ? (
                      <ButtonLink
                        href={`/assessment/${resumable[0].inProgress!.id}`}
                        variant="sun"
                        iconRight={<IconArrowRight size={17} />}
                      >
                        Resume {resumable[0].child.name}&rsquo;s check
                      </ButtonLink>
                    ) : (
                      <ButtonLink
                        href={`/children/${summaries[0].child.id}/pay`}
                        variant="sun"
                        iconRight={<IconArrowRight size={17} />}
                      >
                        Start a new check
                      </ButtonLink>
                    )}
                    <Link
                      href="/children"
                      className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      My children
                      <IconChevronRight size={15} />
                    </Link>
                  </div>
                )}
              </div>

              <Mascot size={104} mood="wave" className="hidden shrink-0 sm:block" />
            </div>
          </div>
        </Shell>

        {/* ══ the numbers ══════════════════════════════════════════════════ */}
        <Shell width="wide">
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-[124px] animate-pulse rounded-2xl bg-surface-3" />
              ))
            ) : (
              <>
                <StatTile
                  value={totals.children}
                  label={totals.children === 1 ? "Child" : "Children"}
                  icon={<IconStarFilled size={19} />}
                  gradient="linear-gradient(135deg, var(--brand-600), var(--brand-500))"
                  href="/children"
                />
                <StatTile
                  value={totals.done}
                  label={totals.done === 1 ? "Check done" : "Checks done"}
                  icon={<IconCheck size={19} />}
                  gradient="linear-gradient(135deg, var(--st-on-track), var(--sec-language))"
                  href="/profile"
                />
                <StatTile
                  value={totals.open}
                  label={totals.open === 1 ? "In progress" : "In progress"}
                  icon={<IconClock size={19} />}
                  gradient="linear-gradient(135deg, var(--sun-500), var(--coral-500))"
                  href={resumable[0] ? `/assessment/${resumable[0].inProgress!.id}` : "/children"}
                />
                <StatTile
                  value={totals.avgDq ?? "—"}
                  label="Average quotient"
                  icon={<IconTrophy size={19} />}
                  gradient="linear-gradient(135deg, var(--sec-auditory), var(--sec-visual))"
                  href="/profile"
                />
              </>
            )}
          </div>
        </Shell>

        {/* ══ pick up where you left off ═══════════════════════════════════ */}
        {!loading && resumable.length > 0 && (
          <Section size="sm">
            <Shell width="wide">
              <p className="eyebrow eyebrow-accent">Unfinished</p>
              <h2 className="mt-1.5">Pick up where you left off</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {resumable.map(({ child, inProgress }) => (
                  <Link
                    key={inProgress!.id}
                    href={`/assessment/${inProgress!.id}`}
                    className="clay clay-press lift flex items-center gap-4 p-4"
                    style={{ borderLeft: "5px solid var(--sun-500)" }}
                  >
                    <Avatar name={child.name} photoUrl={child.photoUrl} size={48} ring />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-extrabold text-ink">{child.name}</p>
                      <p className="text-sm font-semibold text-ink-3">
                        {Object.keys(inProgress!.responses).length} question
                        {Object.keys(inProgress!.responses).length === 1 ? "" : "s"} answered
                      </p>
                    </div>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
                      style={{ background: "var(--sun-100)", color: "var(--sun-700)" }}
                    >
                      <IconBolt size={13} /> Resume
                    </span>
                  </Link>
                ))}
              </div>
            </Shell>
          </Section>
        )}

        {/* ══ the family ═══════════════════════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow eyebrow-accent">Your family</p>
                <h2 className="mt-1.5">Your children</h2>
              </div>
              {!loading && summaries.length > 0 && (
                <ButtonLink
                  href="/children"
                  variant="secondary"
                  size="sm"
                  iconLeft={<IconPlus size={16} />}
                >
                  Add a child
                </ButtonLink>
              )}
            </div>

            {loading ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 animate-pulse rounded-[var(--radius-xl)] bg-surface-3" />
                ))}
              </div>
            ) : summaries.length === 0 ? (
              <Card variant="clay" className="mt-6 p-8 text-center sm:p-12">
                <Mascot size={86} mood="happy" className="mx-auto" />
                <h3 className="mt-5 text-xl">No children yet</h3>
                <p className="mx-auto mt-2 max-w-[42ch] text-base leading-relaxed text-ink-2">
                  Name, birthday and gender — that&rsquo;s all it takes to find their phase.
                </p>
                <ButtonLink
                  href="/children"
                  size="lg"
                  className="mt-6"
                  iconRight={<IconArrowRight size={18} />}
                >
                  Add your first child
                </ButtonLink>
              </Card>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rankChildren(summaries).map((s, i) => (
                  <ChildDashCard key={s.child.id} summary={s} delay={i * 60} />
                ))}
              </div>
            )}
          </Shell>
        </Section>

        {/* ══ the six areas ════════════════════════════════════════════════ */}
        <Section size="sm" className="bg-[var(--surface)]">
          <Shell width="wide">
            <p className="eyebrow eyebrow-accent">What every check covers</p>
            <h2 className="mt-1.5">Six areas of brain development</h2>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DOMAINS.map((d) => {
                const best = bestFor(summaries, d.code);
                return (
                  <div
                    key={d.code}
                    className="flex items-center gap-4 rounded-[var(--radius-xl)] border border-line bg-[var(--surface)] p-4"
                    style={{ borderLeft: `5px solid ${domainColor(d.code)}` }}
                  >
                    <SectionTile code={d.code} size={46} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-ink">{d.short}</p>
                      {best ? (
                        <>
                          <Meter
                            value={best.percent}
                            color={domainColor(d.code)}
                            className="mt-2"
                            label={`${d.short}: ${Math.round(best.percent)} percent`}
                          />
                          <p className="mt-1.5 text-xs font-semibold text-ink-3">
                            {best.childName} · {best.cell}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs font-medium leading-relaxed text-ink-3">
                          {d.blurb}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Shell>
        </Section>

        {/* ══ reports ══════════════════════════════════════════════════════ */}
        {!loading && summaries.some((s) => s.completed.length > 0) && (
          <Section size="sm">
            <Shell width="wide">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow eyebrow-accent">Keepsakes</p>
                  <h2 className="mt-1.5">Recent reports</h2>
                </div>
                <ButtonLink
                  href="/profile"
                  variant="ghost"
                  size="sm"
                  iconRight={<IconChevronRight size={16} />}
                >
                  See all
                </ButtonLink>
              </div>

              <div className="mt-5 grid gap-3">
                {recentReports(summaries).map(({ child, assessment }) => (
                  <div
                    key={assessment.id}
                    className="flex flex-wrap items-center gap-4 rounded-[var(--radius-xl)] border border-line bg-[var(--surface)] px-5 py-4"
                  >
                    <Avatar name={child.name} photoUrl={child.photoUrl} size={42} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-ink">{child.name}</p>
                      <p className="text-sm font-semibold text-ink-3">
                        {formatDateTime(assessment.completedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <ButtonLink href={`/report/${assessment.id}`} variant="secondary" size="sm">
                        View
                      </ButtonLink>
                      <ButtonLink
                        href={`/report/${assessment.id}?download=1`}
                        size="sm"
                        iconLeft={<IconDownload size={15} />}
                      >
                        Download
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            </Shell>
          </Section>
        )}

        {/* ══ programme ════════════════════════════════════════════════════ */}
        <Section size="sm">
          <Shell width="wide">
            <div
              className="relative overflow-hidden px-6 py-9 sm:px-10"
              style={{
                borderRadius: "var(--radius-xl)",
                background: "linear-gradient(140deg, var(--sec-language), var(--sec-auditory))",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full"
                style={{ background: "#fff", opacity: 0.08 }}
              />
              <div className="relative flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-[46ch]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/18 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                    <IconSparkle size={13} /> Kaushalya Genius Kid Program
                  </span>
                  <h3 className="mt-3 text-white">Keep going between checks</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/80">
                    Daily ten-minute activities built for the exact phase your child is on.
                  </p>
                </div>
                <a
                  href="https://www.kaushalyageniuskid.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sun"
                >
                  Explore the programme
                  <IconArrowRight size={17} />
                </a>
              </div>
            </div>
          </Shell>
        </Section>
      </main>

      <Footer />
    </>
  );
}

/* ══ pieces ════════════════════════════════════════════════════════════════ */

function StatTile({
  value,
  label,
  icon,
  gradient,
  href,
}: {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
  href: string;
}) {
  return (
    <Link
      href={href}
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

function ChildDashCard({ summary, delay }: { summary: ChildSummary; delay: number }) {
  const { child, ageMonths, phase, completed, inProgress, latest } = summary;
  const status: StatusCode | null = latest?.result.overallStatus ?? null;
  const dq = latest?.result.overallDq ?? null;

  return (
    <Card
      variant="clay"
      className="animate-rise lift flex flex-col overflow-hidden !p-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* A colour band that says the child's status at a glance, before any
          number is read. Falls back to the brand tint when there's no score
          yet, so an un-assessed child doesn't read as a neutral verdict. */}
      <div
        className="h-1.5 w-full"
        style={{ background: status ? statusColor(status) : "var(--accent-line)" }}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-4">
          <Avatar name={child.name} photoUrl={child.photoUrl} size={58} ring />
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-lg font-extrabold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {child.name}
            </p>
            <p className="text-sm font-semibold text-ink-3">{formatAge(ageMonths)}</p>
          </div>
          {dq !== null && (
            <ProgressRing
              value={Math.min(100, dq)}
              size={52}
              stroke={5}
              color={status ? statusColor(status) : "var(--accent)"}
            >
              <span className="tnum text-sm font-extrabold text-ink">{Math.round(dq)}</span>
            </ProgressRing>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="accent">{phaseLabel(phase)}</Badge>
          {status ? (
            <StatusChip status={status} label={STATUSES[status].label} />
          ) : inProgress ? (
            <Badge tone="sun">In progress</Badge>
          ) : (
            <Badge tone="neutral">No checks yet</Badge>
          )}
        </div>

        {latest && (
          <div
            className="mt-4 rounded-[var(--radius)] px-3.5 py-3"
            style={{ background: statusSoft(latest.result.overallStatus) }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-ink-3">Strongest</p>
            <p className="mt-0.5 text-sm font-bold text-ink">
              {latest.result.strengths.length > 0
                ? latest.result.strengths.map(domainName).join(", ")
                : "Even across all six areas"}
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2.5 pt-5">
          <ButtonLink href={`/children/${child.id}`} variant="secondary" size="sm" block>
            Profile
          </ButtonLink>
          {inProgress ? (
            <ButtonLink href={`/assessment/${inProgress.id}`} size="sm" block>
              Resume
            </ButtonLink>
          ) : completed.length > 0 ? (
            <ButtonLink href={`/report/${completed[0].id}`} size="sm" block>
              Report
            </ButtonLink>
          ) : (
            <ButtonLink href={`/children/${child.id}/pay`} size="sm" block>
              Start check
            </ButtonLink>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ══ derivations ═══════════════════════════════════════════════════════════ */

/**
 * The order children appear in on the dashboard.
 *
 * listChildren() returns them in whatever order the database hands back,
 * which is fine for one child and arbitrary for four. The first card is the
 * most valuable slot on this page — it is what a parent opening the app on
 * their phone sees without scrolling — so what lands there is a product
 * decision, not a default.
 *
 * Must not mutate `summaries`; return a new array.
 */
function rankChildren(summaries: ChildSummary[]): ChildSummary[] {
  // TODO(human): decide and implement the ordering.
  return summaries;
}

/**
 * The best result any child has for one competence, so the six-areas strip
 * shows the family's own data rather than six identical blurbs. Returns null
 * until someone has completed a check.
 */
function bestFor(
  summaries: ChildSummary[],
  domain: DomainCode,
): { percent: number; childName: string; cell: string } | null {
  let best: { percent: number; childName: string; cell: string } | null = null;
  for (const s of summaries) {
    const score = s.latest?.result.domainScores.find((d) => d.domain === domain);
    if (!score) continue;
    if (!best || score.percent > best.percent) {
      best = { percent: score.percent, childName: s.child.name, cell: score.cell.description };
    }
  }
  return best;
}

function recentReports(summaries: ChildSummary[]) {
  return summaries
    .flatMap((s) => s.completed.map((assessment) => ({ child: s.child, assessment })))
    .sort((a, b) => (b.assessment.completedAt ?? "").localeCompare(a.assessment.completedAt ?? ""))
    .slice(0, 4);
}

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
