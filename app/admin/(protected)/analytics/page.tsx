"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminAnalytics, type AdminAnalytics } from "@/lib/admin/analytics";
import type { LeadStatus } from "@/lib/admin/leads";
import {
  Badge,
  Button,
  Card,
  IconBolt,
  IconCheck,
  IconClock,
  IconPhone,
  IconRefresh,
  IconSparkle,
  IconTrophy,
  IconUsers,
  Mascot,
  Meter,
  SectionTile,
  domainColor,
  domainName,
} from "@/components/ui";

const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  follow_up: "Follow Up",
  converted: "Converted",
  not_interested: "Not Interested",
  lost: "Lost",
};

const LEAD_STATUS_TONE: Record<LeadStatus, "neutral" | "accent" | "success" | "danger" | "warn"> = {
  new: "accent",
  contacted: "neutral",
  interested: "success",
  follow_up: "warn",
  converted: "success",
  not_interested: "danger",
  lost: "danger",
};

/**
 * The four moments that matter for the business, in the order a parent
 * actually moves through them. Each bar's width is relative to leads — the
 * top of the funnel — so a glance at the row lengths shows where the
 * biggest drop happens without reading a single number.
 */
function funnelSteps(data: AdminAnalytics) {
  return [
    { label: "Leads", value: data.leadsTotal, icon: <IconPhone size={18} />, color: "var(--accent)" },
    { label: "Added a child", value: data.childrenTotal, icon: <IconUsers size={18} />, color: "var(--sec-auditory)" },
    { label: "Started an assessment", value: data.assessmentsStarted, icon: <IconBolt size={18} />, color: "var(--sun-500)" },
    { label: "Completed", value: data.assessmentsCompleted, icon: <IconCheck size={18} />, color: "var(--st-on-track)" },
  ];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminAnalytics()
      .then(setData)
      .catch((err) => setError(err?.message ?? "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const isEmpty = data && data.leadsTotal === 0;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <h1 className="text-2xl font-bold text-ink tracking-tight">Analytics</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={loading}
          iconLeft={<IconRefresh size={14} className={loading ? "animate-spin" : ""} />}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-xl bg-[var(--st-consult-soft)] px-4 py-3 text-sm font-semibold text-[var(--st-consult-ink)]">
          {error}
        </p>
      )}

      {!data ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-3" />
          ))}
        </div>
      ) : isEmpty ? (
        <Card className="p-10 text-center">
          <Mascot size={80} mood="think" className="mx-auto" />
          <p className="mt-4 text-sm font-bold text-ink">Nothing to show yet</p>
          <p className="mt-1 text-sm text-ink-3">
            The funnel fills in as soon as your first lead comes through.
          </p>
        </Card>
      ) : (
        <>
          {/* ── the funnel ───────────────────────────────────────────────── */}
          <Card className="p-5 sm:p-6">
            <p className="mb-4 text-sm font-bold text-ink">From lead to finished check</p>
            <div className="space-y-4">
              {funnelSteps(data).map((step, i, all) => {
                const of = all[0].value || 1;
                const pctOfLeads = Math.round((step.value / of) * 100);
                const prev = i > 0 ? all[i - 1].value : null;
                const pctOfPrev = prev ? Math.round((step.value / (prev || 1)) * 100) : null;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-ink-2">
                        <span style={{ color: step.color }}>{step.icon}</span>
                        {step.label}
                      </span>
                      <span className="flex items-baseline gap-2">
                        <span className="tnum text-xl font-extrabold text-ink">{step.value}</span>
                        {i > 0 && (
                          <span className="text-xs font-semibold text-ink-3">
                            {pctOfPrev}% of {all[i - 1].label.toLowerCase()}
                          </span>
                        )}
                      </span>
                    </div>
                    <Meter value={pctOfLeads} color={step.color} className="mt-2" label={`${step.label}: ${step.value}`} />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── purchases + progress breakdown ──────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat
              value={data.assessmentsPaid}
              label="Paid checks"
              sub={`${data.assessmentsFree} started free with a coupon`}
              icon={<IconSparkle size={18} />}
              color="var(--sun-500)"
            />
            <MiniStat
              value={data.assessmentsInProgress}
              label="Left in the middle"
              sub="Paid or started, not yet finished"
              icon={<IconClock size={18} />}
              color="var(--st-emerging)"
            />
            <MiniStat
              value={
                data.assessmentsStarted > 0
                  ? `${Math.round((data.assessmentsCompleted / data.assessmentsStarted) * 100)}%`
                  : "—"
              }
              label="Finish rate"
              sub="Completed ÷ started"
              icon={<IconTrophy size={18} />}
              color="var(--st-on-track)"
            />
          </div>

          {/* ── where people give up ────────────────────────────────────── */}
          <Card className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink">Where people give up</p>
            <p className="mt-1 text-xs text-ink-3">
              The last section reached by every check that hasn&rsquo;t been finished
            </p>
            {data.dropoffByDomain.length === 0 ? (
              <p className="mt-4 text-sm text-ink-3">
                No one has stopped partway through a section yet.
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {data.dropoffByDomain.map((d) => {
                  const pct = Math.round((d.count / data.assessmentsInProgress) * 100);
                  return (
                    <div key={d.domain} className="flex items-center gap-3.5">
                      <SectionTile code={d.domain} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-bold text-ink">
                            {domainName(d.domain)}
                          </span>
                          <span className="tnum text-sm font-extrabold text-ink-3">
                            {d.count} <span className="font-medium text-ink-3">({pct}%)</span>
                          </span>
                        </div>
                        <Meter
                          value={pct}
                          color={domainColor(d.domain)}
                          className="mt-1.5 !h-2.5"
                          label={`${domainName(d.domain)}: ${d.count} dropped off here`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* ── lead pipeline ────────────────────────────────────────────── */}
          <Card className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink">Lead status</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((status) => (
                <Badge key={status} tone={LEAD_STATUS_TONE[status]} size="lg">
                  {LEAD_STATUS_LABEL[status]}
                  <span className="tnum ml-1.5 font-extrabold">{data.leadsByStatus[status]}</span>
                </Badge>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function MiniStat({
  value,
  label,
  sub,
  icon,
  color,
}: {
  value: ReactNode;
  label: string;
  sub: string;
  icon: ReactNode;
  color: string;
}) {
  return (
    <Card className="flex items-start gap-3.5 p-5">
      <span
        className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl"
        style={{ color, background: `color-mix(in srgb, ${color} 13%, var(--surface))` }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="tnum text-2xl font-extrabold leading-none text-ink">{value}</p>
        <p className="mt-1 text-sm font-bold text-ink">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{sub}</p>
      </div>
    </Card>
  );
}
