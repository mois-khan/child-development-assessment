/**
 * Business numbers for the admin dashboard.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE
 *
 * Every number states its unit and its channel, because the bug this
 * replaced came from mixing both. The old funnel counted leads (parents
 * only — a school account deliberately has no leads row), then counted
 * children (parents AND school students), then divided the second by the
 * first. Two populations, one ratio. It could read over 100% and nobody
 * could tell which half was wrong.
 *
 * So:
 *   - `channel` splits the two businesses. Direct is the self-signup family
 *     that sales works; school is an institutional roster that was sold
 *     before the account existed and never enters the funnel at all.
 *   - A funnel counts ONE unit the whole way down. The account funnel counts
 *     accounts at every step; the child funnel counts children at every
 *     step. They answer different questions and are never mixed.
 *   - Each funnel step is intersected with the step above it, so a step can
 *     never exceed its predecessor. That is what a funnel means, and it
 *     makes the >100% failure structurally impossible rather than unlikely.
 *
 * The channel itself is defined once, in SQL — public.account_channel() in
 * 0016_analytics_engine.sql. Do not re-derive it here.
 */
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DOMAINS } from "@/content/domains";
import type { DomainCode } from "@/lib/types";
import type { Channel, LeadStatus } from "@/lib/supabase/database.types";

/* ── shapes ──────────────────────────────────────────────────────────────── */

export interface DomainDropoff {
  domain: DomainCode;
  count: number;
}

/** Accounts, at every step. An account that paid for two children counts
 *  once — this measures how many families convert, not how much they buy. */
export interface AccountFunnel {
  leads: number;
  addedChild: number;
  paid: number;
  started: number;
  completed: number;
}

/** Children, at every step. This is the one that measures the ₹99 gate,
 *  because the gate is per child, not per family. */
export interface ChildFunnel {
  children: number;
  paid: number;
  started: number;
  completed: number;
}

export interface AssessmentHealth {
  completed: number;
  /** Unfinished and recently touched — someone is still working on it. */
  live: number;
  /** Unfinished and gone quiet. See `classifyProgress`. */
  abandoned: number;
  /** Where the abandoned ones stopped. Live ones are excluded: an
   *  assessment started this morning is not a drop-off. */
  dropoffByDomain: DomainDropoff[];
  medianMinutesToComplete: number | null;
}

export interface RevenueSummary {
  /** Real money, in paise. Coupon redemptions contribute nothing here. */
  grossPaise: number;
  cashPayments: number;
  couponRedemptions: number;
  /** Orders created that never reached `paid` — abandoned or failed
   *  checkouts. Previously invisible, and the clearest revenue leak. */
  failedCheckouts: number;
}

export interface DirectSegment {
  accounts: AccountFunnel;
  children: ChildFunnel;
  assessments: AssessmentHealth;
  revenue: RevenueSummary;
  leadsByStatus: Record<LeadStatus, number>;
  /** Signup to first logged interaction. The sales responsiveness number. */
  medianHoursToFirstContact: number | null;
  /** Leads whose follow-up date has passed. */
  overdueFollowUps: number;
}

export interface SchoolSegment {
  schools: number;
  students: number;
  studentsAssessed: number;
  studentsCompleted: number;
  /** Students with a finished check, over students on the roster. The one
   *  number that says whether a school contract is being used or has gone
   *  quiet — which is churn risk visible before renewal, not after. */
  rosterUtilisation: number;
  assessments: AssessmentHealth;
  revenue: RevenueSummary;
}

export interface AdminAnalytics {
  generatedAt: string;
  direct: DirectSegment;
  school: SchoolSegment;
}

/** Thrown when the signed-in admin lacks the 'analytics' page grant. The
 *  views return zero rows in that case, which would otherwise render as a
 *  dashboard full of honest-looking zeroes. */
export class AnalyticsAccessError extends Error {
  constructor() {
    super("You don't have access to analytics. Ask a super admin to grant the Analytics page.");
    this.name = "AnalyticsAccessError";
  }
}

/* ── row types, as the views return them ─────────────────────────────────── */

interface LeadRow {
  profile_id: string;
  status: LeadStatus;
  next_follow_up_at: string | null;
  first_interaction_at: string | null;
  created_at: string;
}

interface ChildRow {
  id: string;
  profile_id: string;
  channel: Channel;
}

export interface AssessmentRow {
  id: string;
  child_id: string;
  profile_id: string;
  channel: Channel;
  status: "in_progress" | "complete";
  stages_by_domain: Record<string, string[]>;
  created_at: string;
  completed_at: string | null;
  last_answered_at: string | null;
  answered_count: number;
}

interface PaymentRow {
  profile_id: string;
  child_id: string | null;
  channel: Channel;
  amount_paise: number;
  status: "created" | "paid" | "failed" | "cancelled";
  kind: "cash" | "coupon";
}

/* ── the one judgement call ──────────────────────────────────────────────── */

/**
 * Is an unfinished assessment still alive, or did the parent give up?
 *
 * Nothing in the data says "abandoned" — an assessment sits at
 * `in_progress` forever whether it was opened five minutes ago or left in
 * March. The old drop-off chart counted both as drop-offs, which is why it
 * always looked worse than reality.
 *
 * Inputs available on the row:
 *   - `created_at`      when it was started
 *   - `last_answered_at`when the most recent question was answered, or null
 *                       if the parent opened it and answered nothing
 *   - `answered_count`  how many questions are in so far
 */
const HOUR_MS = 3_600_000;

function classifyProgress(a: AssessmentRow, now: Date): "live" | "abandoned" {
  const startedMs = Date.parse(a.created_at);

  // Grace period: anything opened in the last hour is still being worked on
  // regardless of how far it's gotten — a parent mid-sitting isn't a
  // drop-off just because they haven't answered anything yet.
  if (now.getTime() - startedMs < HOUR_MS) return "live";

  if (a.last_answered_at === null) {
    // Opened it and answered nothing at all. That is weaker engagement than
    // someone mid-assessment, so it gets a much shorter clock — six hours,
    // not the multi-day allowance below.
    return now.getTime() - startedMs > 6 * HOUR_MS ? "abandoned" : "live";
  }

  // Six sections realistically span more than one sitting — a parent doing
  // this over breakfast and again after work is normal, so the bar has to
  // survive an overnight gap without forgiving someone who quietly quit
  // weeks ago. Three days of silence is the line.
  const hoursSinceLastAnswer = (now.getTime() - Date.parse(a.last_answered_at)) / HOUR_MS;
  return hoursSinceLastAnswer > 72 ? "abandoned" : "live";
}

/* ── small helpers ───────────────────────────────────────────────────────── */

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
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

function summariseRevenue(payments: PaymentRow[]): RevenueSummary {
  const paid = payments.filter((p) => p.status === "paid");
  return {
    grossPaise: paid.reduce((sum, p) => sum + p.amount_paise, 0),
    cashPayments: paid.filter((p) => p.kind === "cash").length,
    couponRedemptions: paid.filter((p) => p.kind === "coupon").length,
    failedCheckouts: payments.filter((p) => p.status !== "paid").length,
  };
}

function summariseAssessments(rows: AssessmentRow[], now: Date): AssessmentHealth {
  const completed = rows.filter((a) => a.status === "complete");
  const unfinished = rows.filter((a) => a.status !== "complete");
  const abandoned = unfinished.filter((a) => classifyProgress(a, now) === "abandoned");

  // Sections run strictly one at a time, so the furthest column with any
  // stage recorded is the furthest the parent ever got.
  const counts: Partial<Record<DomainCode, number>> = {};
  for (const a of abandoned) {
    let furthest: DomainCode | null = null;
    for (const d of DOMAINS) {
      if ((a.stages_by_domain?.[d.code]?.length ?? 0) > 0) furthest = d.code;
    }
    if (furthest) counts[furthest] = (counts[furthest] ?? 0) + 1;
  }

  const durations = completed
    .filter((a) => a.completed_at)
    .map((a) => (Date.parse(a.completed_at!) - Date.parse(a.created_at)) / 60000)
    .filter((m) => Number.isFinite(m) && m >= 0);

  return {
    completed: completed.length,
    live: unfinished.length - abandoned.length,
    abandoned: abandoned.length,
    dropoffByDomain: DOMAINS.map((d) => ({ domain: d.code, count: counts[d.code] ?? 0 })).filter(
      (d) => d.count > 0
    ),
    medianMinutesToComplete: median(durations),
  };
}

/* ── the query ───────────────────────────────────────────────────────────── */

export async function adminAnalytics(): Promise<AdminAnalytics> {
  const supabase = getSupabaseBrowserClient();

  const [leadsRes, childrenRes, assessmentsRes, paymentsRes, schoolsRes] = await Promise.all([
    supabase
      .from("analytics_leads")
      .select("profile_id, status, next_follow_up_at, first_interaction_at, created_at"),
    supabase.from("analytics_children").select("id, profile_id, channel"),
    supabase
      .from("analytics_assessments")
      .select(
        "id, child_id, profile_id, channel, status, stages_by_domain, created_at, completed_at, last_answered_at, answered_count"
      ),
    supabase
      .from("analytics_payments")
      .select("profile_id, child_id, channel, amount_paise, status, kind"),
    supabase.from("analytics_schools").select("id"),
  ]);

  for (const res of [leadsRes, childrenRes, assessmentsRes, paymentsRes, schoolsRes]) {
    if (res.error) throw new Error("Analytics query failed: " + res.error.message);
  }

  const leads = (leadsRes.data ?? []) as LeadRow[];
  const children = (childrenRes.data ?? []) as ChildRow[];
  const assessments = (assessmentsRes.data ?? []) as AssessmentRow[];
  const payments = (paymentsRes.data ?? []) as PaymentRow[];

  // The views filter on can_read_analytics() rather than erroring, so a
  // missing grant looks exactly like an empty database. Leads is the one
  // table that is never legitimately empty in a live system — signup writes
  // a row — so a total absence means "not allowed", not "nothing happened".
  if (leads.length === 0 && children.length === 0 && payments.length === 0) {
    const { count } = await supabase
      .from("children")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) throw new AnalyticsAccessError();
  }

  const now = new Date();

  /* ── direct ────────────────────────────────────────────────────────────── */

  const directChildren = children.filter((c) => c.channel === "direct");
  const directAssessments = assessments.filter((a) => a.channel === "direct");
  const directPayments = payments.filter((p) => p.channel === "direct");

  const paidChildIds = new Set(
    payments.filter((p) => p.status === "paid" && p.child_id).map((p) => p.child_id!)
  );
  const startedChildIds = new Set(assessments.map((a) => a.child_id));
  const completedChildIds = new Set(
    assessments.filter((a) => a.status === "complete").map((a) => a.child_id)
  );

  // Each step narrows the one above it, so the funnel cannot widen.
  const leadIds = new Set(leads.map((l) => l.profile_id));
  const withChild = new Set(
    directChildren.map((c) => c.profile_id).filter((id) => leadIds.has(id))
  );
  const withPaid = new Set(
    directPayments
      .filter((p) => p.status === "paid")
      .map((p) => p.profile_id)
      .filter((id) => withChild.has(id))
  );
  const withStarted = new Set(
    directAssessments.map((a) => a.profile_id).filter((id) => withPaid.has(id))
  );
  const withCompleted = new Set(
    directAssessments
      .filter((a) => a.status === "complete")
      .map((a) => a.profile_id)
      .filter((id) => withStarted.has(id))
  );

  const leadsByStatus = { ...EMPTY_LEAD_COUNTS };
  for (const l of leads) {
    if (l.status in leadsByStatus) leadsByStatus[l.status]++;
  }

  const contactLags = leads
    .filter((l) => l.first_interaction_at)
    .map((l) => (Date.parse(l.first_interaction_at!) - Date.parse(l.created_at)) / 3600000)
    .filter((h) => Number.isFinite(h) && h >= 0);

  const directChildIds = new Set(directChildren.map((c) => c.id));

  const direct: DirectSegment = {
    accounts: {
      leads: leads.length,
      addedChild: withChild.size,
      paid: withPaid.size,
      started: withStarted.size,
      completed: withCompleted.size,
    },
    children: {
      children: directChildren.length,
      paid: [...directChildIds].filter((id) => paidChildIds.has(id)).length,
      started: [...directChildIds].filter((id) => startedChildIds.has(id)).length,
      completed: [...directChildIds].filter((id) => completedChildIds.has(id)).length,
    },
    assessments: summariseAssessments(directAssessments, now),
    revenue: summariseRevenue(directPayments),
    leadsByStatus,
    medianHoursToFirstContact: median(contactLags),
    overdueFollowUps: leads.filter(
      (l) => l.next_follow_up_at && Date.parse(l.next_follow_up_at) < now.getTime()
    ).length,
  };

  /* ── school ────────────────────────────────────────────────────────────── */

  const schoolChildren = children.filter((c) => c.channel === "school");
  const schoolChildIds = new Set(schoolChildren.map((c) => c.id));
  const studentsCompleted = [...schoolChildIds].filter((id) => completedChildIds.has(id)).length;

  const school: SchoolSegment = {
    schools: (schoolsRes.data ?? []).length,
    students: schoolChildren.length,
    studentsAssessed: [...schoolChildIds].filter((id) => startedChildIds.has(id)).length,
    studentsCompleted,
    rosterUtilisation: schoolChildren.length === 0 ? 0 : studentsCompleted / schoolChildren.length,
    assessments: summariseAssessments(
      assessments.filter((a) => a.channel === "school"),
      now
    ),
    revenue: summariseRevenue(payments.filter((p) => p.channel === "school")),
  };

  return { generatedAt: now.toISOString(), direct, school };
}
