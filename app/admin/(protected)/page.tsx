"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardCounts, type AdminDashboardCounts } from "@/lib/admin/data";
import { adminAnalytics, AnalyticsAccessError, type AdminAnalytics } from "@/lib/admin/analytics";
import {
  BRAND_GRADIENT,
  IconBolt,
  IconPhone,
  IconUsers,
  IconCheck,
  IconSchool,
  IconClock,
  IconRupee,
  IconClipboard,
  IconChart,
} from "@/components/ui";
import type { ReactNode, CSSProperties } from "react";

/** Funnel: the direct-lead pipeline. School: roster activation — same 78°
 *  dark→bright→dark shape, a different hue so the two panels read as
 *  distinct programmes at a glance. */
const FUNNEL_GRADIENT = "linear-gradient(78deg, #04314d 0%, #3aa7ef 55%, #022c58 100%)";
const SCHOOL_GRADIENT = "linear-gradient(78deg, #04331f 0%, #2fd480 55%, #022518 100%)";

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function formatPct(ratio: number): string {
  return Math.round(ratio * 100) + "%";
}

/**
 * Every step a direct (self-signup) family passes through, in order.
 *
 * This has five steps where the old funnel had four — "Paid" didn't exist
 * as a step at all, so the ₹99 gate, the single biggest drop-off in this
 * business, was invisible. It's back because analytics.direct.accounts
 * carries it now (lib/admin/analytics.ts).
 */
function directFunnelSteps(d: AdminAnalytics["direct"]) {
  return [
    { label: "Leads", value: d.accounts.leads, icon: <IconPhone size={18} />, color: "var(--accent)" },
    { label: "Added a child", value: d.accounts.addedChild, icon: <IconUsers size={18} />, color: "var(--sec-auditory)" },
    { label: "Paid", value: d.accounts.paid, icon: <IconRupee size={18} />, color: "var(--sun-500)" },
    { label: "Started", value: d.accounts.started, icon: <IconBolt size={18} />, color: "var(--sec-visual)" },
    { label: "Completed", value: d.accounts.completed, icon: <IconCheck size={18} />, color: "var(--st-on-track)" },
  ];
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardCounts()
      .then(setCounts)
      .catch((err) => setError(err.message ?? "Failed to load"));
    adminAnalytics()
      .then(setAnalytics)
      // Distinguish "you don't have the grant" from "something broke" —
      // the old code swallowed both, so a missing page grant looked
      // identical to the funnel just not rendering.
      .catch((err) =>
        setAnalyticsError(
          err instanceof AnalyticsAccessError ? err.message : "Couldn't load analytics."
        )
      );
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 pb-10">

      {/* ── Greeting banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8"
        style={{ background: BRAND_GRADIENT }}
      >
        {/* decorative circles */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-52 rounded-full opacity-[0.15]"
          style={{ background: "var(--coral-300)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-[40%] size-40 rounded-full opacity-[0.08]"
          style={{ background: "var(--sun-300)" }}
        />

        <div className="relative">
          <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-white/60">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-1 !text-2xl font-extrabold text-white sm:!text-3xl">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-white/65">
            Here's what's happening across the programme.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-[var(--st-consult-soft)] px-4 py-3 text-sm font-semibold text-[var(--st-consult-ink)]">
          {error}
        </p>
      )}

      {/* ── Primary stats ── */}
      {!counts ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PrimaryCard
              value={analytics?.direct.accounts.leads ?? "—"}
              label="Total Leads"
              icon={<IconPhone size={18} />}
              color="var(--accent)"
              href="/admin/leads"
            />
            <PrimaryCard
              value={counts.totalChildren}
              label="Total Children"
              icon={<IconUsers size={18} />}
              color="var(--sec-auditory)"
              href="/admin/children"
            />
            <PrimaryCard
              value={counts.totalAssessments}
              label="Total Assessments"
              icon={<IconClipboard size={18} />}
              color="var(--st-on-track)"
              href="/admin/assessments"
            />
            <PrimaryCard
              value={formatRupees(counts.totalRevenuePaise)}
              label="Total Revenue"
              icon={<IconRupee size={18} />}
              color="var(--sun-500)"
              href="/admin/purchases"
            />
          </div>

          {analyticsError && (
            <p className="rounded-xl bg-[var(--st-consult-soft)] px-4 py-3 text-sm font-semibold text-[var(--st-consult-ink)]">
              {analyticsError}
            </p>
          )}

          {/* ── the direct funnel ────────────────────────────────────────── */}
          {analytics && analytics.direct.accounts.leads > 0 && (
            <div
              className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
              style={{ background: FUNNEL_GRADIENT }}
            >
              <div
                aria-hidden="true"
                className="bloom"
                style={{ width: 220, height: 220, top: -100, right: "8%", "--bloom-color": "#ffffff", opacity: 0.15 } as CSSProperties}
              />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="lg:w-52 lg:shrink-0">
                  <p className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    From lead to finished check
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Every self-signed-up family's path from first contact to a finished check.
                  </p>
                  {analytics.direct.overdueFollowUps > 0 && (
                    <Link
                      href="/admin/leads"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                    >
                      <IconClock size={13} /> {analytics.direct.overdueFollowUps} follow-up{analytics.direct.overdueFollowUps === 1 ? "" : "s"} overdue
                    </Link>
                  )}
                </div>

                <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {directFunnelSteps(analytics.direct).map((step, i, all) => {
                    const prev = i > 0 ? all[i - 1] : null;
                    const pctOfPrev = prev ? Math.round((step.value / (prev.value || 1)) * 100) : null;
                    return (
                      <div
                        key={step.label}
                        className="rounded-2xl bg-[var(--surface)] p-4 text-center shadow-[var(--clay-sm)]"
                      >
                        <span
                          className="mx-auto grid size-10 place-items-center rounded-full text-white"
                          style={{ background: step.color }}
                        >
                          {step.icon}
                        </span>
                        <p className="mt-3 text-sm font-extrabold leading-snug text-ink">{step.label}</p>
                        <p className="text-xs font-semibold text-ink-3">
                          {prev ? `${pctOfPrev}% of ${prev.label.toLowerCase()}` : "Top of funnel"}
                        </p>
                        <p className="tnum mt-2 text-2xl font-extrabold text-ink">{step.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── school activation ────────────────────────────────────────── */}
          {analytics && analytics.school.schools > 0 && (
            <div
              className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
              style={{ background: SCHOOL_GRADIENT }}
            >
              <div
                aria-hidden="true"
                className="bloom"
                style={{ width: 220, height: 220, top: -100, right: "8%", "--bloom-color": "#ffffff", opacity: 0.15 } as CSSProperties}
              />
              <div className="relative flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    School activation
                  </p>
                  <p className="mt-1 text-sm text-white/75">
                    How actively each school's roster is being screened.
                  </p>
                </div>
                <Link
                  href="/admin/schools"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  <IconSchool size={14} /> {analytics.school.schools} school{analytics.school.schools === 1 ? "" : "s"}
                </Link>
              </div>

              <div className="relative mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SchoolTile
                  value={analytics.school.students}
                  label="Students on roster"
                  icon={<IconUsers size={16} />}
                  color="var(--sec-auditory)"
                />
                <SchoolTile
                  value={analytics.school.studentsAssessed}
                  label="Assessed"
                  icon={<IconClipboard size={16} />}
                  color="var(--sec-visual)"
                />
                <SchoolTile
                  value={analytics.school.studentsCompleted}
                  label="Completed"
                  icon={<IconCheck size={16} />}
                  color="var(--st-on-track)"
                />
                <SchoolTile
                  value={formatPct(analytics.school.rosterUtilisation)}
                  label="Roster utilisation"
                  icon={<IconChart size={16} />}
                  color="var(--accent)"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Card components ────────────────────────────────────────────────────── */

function PrimaryCard({
  value,
  label,
  icon,
  color,
  href,
}: {
  value: ReactNode;
  label: string;
  icon: ReactNode;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="clay group relative overflow-hidden rounded-2xl bg-[var(--surface)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-5"
    >
      <span
        className="grid size-9 place-items-center rounded-xl text-white"
        style={{ background: color } as CSSProperties}
      >
        {icon}
      </span>
      <p className="tnum mt-4 text-3xl font-extrabold leading-none text-ink sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-ink-3">{label}</p>
    </Link>
  );
}

function SchoolTile({
  value,
  label,
  icon,
  color,
}: {
  value: ReactNode;
  label: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-4 text-center shadow-[var(--clay-sm)]">
      <span
        className="mx-auto grid size-9 place-items-center rounded-full text-white"
        style={{ background: color }}
      >
        {icon}
      </span>
      <p className="tnum mt-2.5 text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink-3">{label}</p>
    </div>
  );
}
