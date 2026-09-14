"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardCounts, type AdminDashboardCounts } from "@/lib/admin/data";
import { adminAnalytics, type AdminAnalytics } from "@/lib/admin/analytics";
import {
  BRAND_GRADIENT,
  IconBolt,
  IconPhone,
  IconUsers,
  IconCheck,
  IconSparkle,
  IconTrophy,
} from "@/components/ui";
import type { ReactNode, CSSProperties } from "react";

function formatRupees(paise: number): string {
  return "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

/**
 * The four moments that matter for the business, in the order a parent
 * actually moves through them.
 */
function funnelSteps(data: AdminAnalytics) {
  return [
    { label: "Leads", value: data.leadsTotal, icon: <IconPhone size={18} />, color: "var(--accent)" },
    { label: "Added a child", value: data.childrenTotal, icon: <IconUsers size={18} />, color: "var(--sec-auditory)" },
    { label: "Started an assessment", value: data.assessmentsStarted, icon: <IconBolt size={18} />, color: "var(--sun-500)" },
    { label: "Completed", value: data.assessmentsCompleted, icon: <IconCheck size={18} />, color: "var(--st-on-track)" },
  ];
}

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardCounts()
      .then(setCounts)
      .catch((err) => setError(err.message ?? "Failed to load"));
    adminAnalytics()
      .then(setAnalytics)
      .catch(() => {});
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
              value={analytics?.leadsTotal ?? "—"}
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
              icon={<IconTrophy size={18} />}
              color="var(--st-on-track)"
              href="/admin/assessments"
            />
            <PrimaryCard
              value={formatRupees(counts.totalRevenuePaise)}
              label="Total Revenue"
              icon={<IconSparkle size={18} />}
              color="var(--sun-500)"
              href="/admin/purchases"
            />
          </div>

          {/* ── the funnel ───────────────────────────────────────────────── */}
          {analytics && analytics.leadsTotal > 0 && (
            <>
              <div
                className="relative overflow-hidden rounded-[28px] p-6 sm:p-8"
                style={{ background: BRAND_GRADIENT }}
              >
                <div
                  aria-hidden="true"
                  className="bloom"
                  style={{ width: 220, height: 220, top: -100, right: "8%", "--bloom-color": "var(--sun-300)", opacity: 0.2 } as CSSProperties}
                />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
                  <div className="lg:w-52 lg:shrink-0">
                    <p className="text-lg font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>
                      From lead to finished check
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">
                      Where every parent stands in the journey, one stage at a time.
                    </p>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-3 md:grid-cols-4">
                    {funnelSteps(analytics).map((step, i, all) => {
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
            </>
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

