/**
 * Business funnel numbers for the admin analytics page — how many people
 * show up, add a child, pay, and finish — plus exactly where the ones who
 * don't finish give up.
 *
 * Read-only aggregate queries against the same tables every other admin
 * page already reads (RLS's is_admin() policy lets an admin see all rows).
 */
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DOMAINS } from "@/content/domains";
import type { DomainCode } from "@/lib/types";
import type { LeadStatus } from "./leads";

export interface DomainDropoff {
  domain: DomainCode;
  count: number;
}

export interface AdminAnalytics {
  leadsTotal: number;
  leadsByStatus: Record<LeadStatus, number>;
  childrenTotal: number;
  assessmentsStarted: number;
  assessmentsPaid: number;
  assessmentsFree: number;
  assessmentsCompleted: number;
  assessmentsInProgress: number;
  /** Only domains at least one abandoned assessment actually reached, in the
   *  chart's own order. */
  dropoffByDomain: DomainDropoff[];
}

const EMPTY_LEAD_COUNTS: Record<LeadStatus, number> = {
  new: 0,
  contacted: 0,
  interested: 0,
  follow_up: 0,
  converted: 0,
  not_interested: 0,
  lost: 0,
};

export async function adminAnalytics(): Promise<AdminAnalytics> {
  const supabase = getSupabaseBrowserClient();

  const [
    { data: leadRows, error: leadsErr },
    { count: childrenCount, error: childErr },
    { data: assessmentRows, error: aErr },
    { data: paymentRows, error: payErr },
  ] = await Promise.all([
    supabase.from("leads").select("status"),
    supabase.from("children").select("*", { count: "exact", head: true }),
    supabase.from("assessments").select("status, stages_by_domain"),
    supabase.from("payments").select("amount_paise").eq("status", "paid"),
  ]);

  if (leadsErr) throw new Error("leads query failed: " + leadsErr.message);
  if (childErr) throw new Error("children query failed: " + childErr.message);
  if (aErr) throw new Error("assessments query failed: " + aErr.message);
  if (payErr) throw new Error("payments query failed: " + payErr.message);

  const leadsByStatus = { ...EMPTY_LEAD_COUNTS };
  for (const l of leadRows ?? []) {
    const status = l.status as LeadStatus;
    if (status in leadsByStatus) leadsByStatus[status]++;
  }

  const assessments = assessmentRows ?? [];
  const inProgress = assessments.filter((a) => a.status !== "complete");
  const completed = assessments.length - inProgress.length;

  // For an assessment that never finished, the furthest a parent got is the
  // last domain (in the chart's own column order) that has any stage
  // recorded — sections run one at a time, so nothing past it was opened yet.
  const dropoffCounts: Partial<Record<DomainCode, number>> = {};
  for (const a of inProgress) {
    const stages = (a.stages_by_domain ?? {}) as Record<string, string[]>;
    let furthest: DomainCode | null = null;
    for (const d of DOMAINS) {
      if ((stages[d.code]?.length ?? 0) > 0) furthest = d.code;
    }
    if (furthest) dropoffCounts[furthest] = (dropoffCounts[furthest] ?? 0) + 1;
  }
  const dropoffByDomain: DomainDropoff[] = DOMAINS.map((d) => ({
    domain: d.code,
    count: dropoffCounts[d.code] ?? 0,
  })).filter((d) => d.count > 0);

  const payments = paymentRows ?? [];
  const assessmentsPaid = payments.filter((p) => (p.amount_paise ?? 0) > 0).length;
  const assessmentsFree = payments.filter((p) => (p.amount_paise ?? 0) === 0).length;

  return {
    leadsTotal: leadRows?.length ?? 0,
    leadsByStatus,
    childrenTotal: childrenCount ?? 0,
    assessmentsStarted: assessments.length,
    assessmentsPaid,
    assessmentsFree,
    assessmentsCompleted: completed,
    assessmentsInProgress: inProgress.length,
    dropoffByDomain,
  };
}
