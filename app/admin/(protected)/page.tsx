"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardCounts, type AdminDashboardCounts } from "@/lib/admin/data";
import { adminLeadStats, type LeadStats } from "@/lib/admin/leads";
import {
  IconCalendar,
  IconClock,
  IconPhone,
  IconShield,
  IconUsers,
  IconCheck,
  IconSparkle,
  IconTrophy,
  IconChart,
} from "@/components/ui";
import type { ReactNode, CSSProperties } from "react";

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<AdminDashboardCounts | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminDashboardCounts()
      .then(setCounts)
      .catch((err) => setError(err.message ?? "Failed to load"));
    adminLeadStats()
      .then(setLeadStats)
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const urgentCount = (counts?.needsFollowUp ?? 0) + (leadStats?.overdue ?? 0);

  return (
    <div className="space-y-6 pb-10">

      {/* ── Greeting banner ── */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8"
        style={{
          background:
            "linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 55%, var(--coral-500) 100%)",
        }}
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

          <Link
            href="/admin/leads"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
          >
            View Leads
            <span className="opacity-70">→</span>
          </Link>

          {urgentCount > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <IconShield size={16} className="mt-px shrink-0 text-white/80" />
              <p className="text-sm font-semibold text-white">
                {urgentCount} item{urgentCount !== 1 ? "s" : ""} need attention today —{" "}
                <Link href="/admin/leads" className="underline underline-offset-2 opacity-80 hover:opacity-100">
                  view leads
                </Link>
              </p>
            </div>
          )}
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
              value={counts.totalParents}
              label="Parents"
              icon={<IconUsers size={20} />}
              gradient="linear-gradient(135deg, var(--brand-600) 0%, var(--brand-500) 100%)"
              href="/admin/parents"
            />
            <PrimaryCard
              value={counts.totalChildren}
              label="Children"
              icon={<IconUsers size={20} />}
              gradient="linear-gradient(135deg, var(--sec-auditory) 0%, var(--sec-visual) 100%)"
              href="/admin/children"
            />
            <PrimaryCard
              value={counts.completedAssessments}
              label="Completed"
              icon={<IconCheck size={20} />}
              gradient="linear-gradient(135deg, var(--st-on-track) 0%, var(--sec-language) 100%)"
              href="/admin/assessments"
            />
            <PrimaryCard
              value={counts.totalPurchases}
              label="Purchases"
              icon={<IconSparkle size={20} />}
              gradient="linear-gradient(135deg, var(--sun-500) 0%, var(--coral-500) 100%)"
              href="/admin/purchases"
            />
          </div>

          {/* ── Action cards ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ActionCard
              value={counts.inProgressAssessments}
              label="In Progress"
              note="Assessments not yet complete"
              icon={<IconClock size={18} />}
              color="var(--st-emerging)"
              soft="var(--st-emerging-soft)"
              href="/admin/assessments"
            />
            <ActionCard
              value={counts.needsFollowUp}
              label="Need Attention"
              note="Developmental concern — call them"
              icon={<IconShield size={18} />}
              color="var(--st-consult)"
              soft="var(--st-consult-soft)"
              href="/admin/leads"
              urgent={counts.needsFollowUp > 0}
            />
            <ActionCard
              value={leadStats?.overdue ?? "—"}
              label="Overdue Follow-Ups"
              note="Past their scheduled call date"
              icon={<IconPhone size={18} />}
              color="var(--st-consult)"
              soft="var(--st-consult-soft)"
              href="/admin/leads"
              urgent={(leadStats?.overdue ?? 0) > 0}
            />
          </div>

          {/* ── Pipeline row ── */}
          {leadStats && (
            <div>
              <p className="mb-2.5 text-2xs font-bold uppercase tracking-[0.14em] text-ink-3">
                Sales Pipeline
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <MicroCard
                  value={leadStats.open}
                  label="Open Leads"
                  icon={<IconChart size={14} />}
                  href="/admin/leads"
                  color="var(--accent)"
                />
                <MicroCard
                  value={leadStats.dueToday}
                  label="Due Today"
                  icon={<IconCalendar size={14} />}
                  href="/admin/leads"
                  color="var(--st-emerging)"
                />
                <MicroCard
                  value={counts.totalAssessments}
                  label="Total Assessments"
                  icon={<IconTrophy size={14} />}
                  href="/admin/assessments"
                  color="var(--sec-visual)"
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
  gradient,
  href,
}: {
  value: ReactNode;
  label: string;
  icon: ReactNode;
  gradient: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-5"
      style={{ background: gradient } as CSSProperties}
    >
      {/* glow */}
      <div className="pointer-events-none absolute -right-3 -top-3 size-16 rounded-full bg-white/20 blur-xl" />

      <span className="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white">
        {icon}
      </span>
      <p className="tnum mt-4 text-3xl font-extrabold leading-none text-white sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-white/75">{label}</p>
    </Link>
  );
}

function ActionCard({
  value,
  label,
  note,
  icon,
  color,
  soft,
  href,
  urgent = false,
}: {
  value: ReactNode;
  label: string;
  note: string;
  icon: ReactNode;
  color: string;
  soft: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: urgent ? soft : "var(--surface)",
        border: `1.5px solid ${urgent ? color : "var(--line)"}`,
      } as CSSProperties}
    >
      <span
        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl"
        style={{ color, background: soft }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="tnum text-2xl font-extrabold leading-none" style={{ color }}>
          {value}
        </p>
        <p className="mt-1 text-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{note}</p>
      </div>
    </Link>
  );
}

function MicroCard({
  value,
  label,
  icon,
  href,
  color,
}: {
  value: ReactNode;
  label: string;
  icon: ReactNode;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl bg-surface px-4 py-3.5 transition-all hover:-translate-y-px hover:shadow-sm"
      style={{ border: "1px solid var(--line)" } as CSSProperties}
    >
      <div className="flex items-center gap-2.5">
        <span style={{ color }}>{icon}</span>
        <p className="text-sm font-semibold text-ink-2">{label}</p>
      </div>
      <p className="tnum font-extrabold" style={{ color }}>
        {value}
      </p>
    </Link>
  );
}
