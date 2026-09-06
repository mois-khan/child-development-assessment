"use client";

/**
 * Sales follow-up tracking — leads, and the trail of calls made against them.
 *
 * THE DESIGN, IN ONE PARAGRAPH
 *
 * Every completed assessment is a sales opportunity, whether or not anyone
 * has acted on it yet. Rather than a separate "create a lead" step someone
 * has to remember to do, adminListLeads() derives one SYNTHETIC lead per
 * completed assessment that has no real record yet — same overlay shape as
 * the item bank and activities (content/items.ts + lib/admin/content.ts):
 * a computed base, edited on top. The synthetic lead is never written to
 * storage. The moment an admin does anything to it — logs a call, reassigns
 * it, edits the phone number — it MATERIALISES into a real stored record,
 * keyed by the assessment's own id so the link back is automatic and there
 * is exactly one lead per assessment, always. A lead can also exist with no
 * assessment behind it at all — a walk-in, a referral, someone who inquired
 * before ever taking the check — created directly with adminCreateLead().
 *
 * WHY A SEPARATE "VERDICT" PER FOLLOW-UP, NOT JUST ONE STATUS ON THE LEAD
 *
 * A single "status" field only ever tells you where things stand right now.
 * The actual sales question is "what happened last time, and what do we do
 * next" — that's a log entry, not a status: a date, a verdict (what
 * happened), a note (why), and — unless the verdict closed the lead — the
 * next follow-up date. adminLogFollowUp() appends one of these AND derives
 * the lead's stage from the verdict in the same call, so the two can never
 * drift apart the way a hand-maintained status field eventually would.
 *
 * NOTE ON "parentName" — the parent-facing intake (app/children/page.tsx)
 * only ever asks for the CHILD's name and an optional phone number; nobody
 * has ever typed a parent's name into this product. Every lead therefore
 * starts identified by the child ("For Aarav"), with `parentName` as a field
 * sales fills in once they've actually spoken to someone — never invented
 * here.
 */
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listAssessments, getChild, type StoredAssessment } from "@/lib/store";

const LEADS_KEY = "kaushalya.admin.leads.v1";

export type LeadStage = "new" | "contacted" | "won" | "lost";

export const LEAD_STAGES: { value: LeadStage; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "In progress" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

/**
 * What happened on one follow-up call. Five outcomes, chosen to be the ones
 * that actually change what happens next — not a generic "notes" free-for-all
 * that would let every rep invent their own taxonomy.
 */
export type FollowUpVerdict =
  | "interested"
  | "no_answer"
  | "converted"
  | "not_interested"
  | "do_not_contact";

export const FOLLOW_UP_VERDICTS: {
  value: FollowUpVerdict;
  label: string;
  /** Does logging this verdict close the lead (won/lost), or keep it open? */
  closes: boolean;
}[] = [
  { value: "interested", label: "Interested — call again", closes: false },
  { value: "no_answer", label: "No answer — try again", closes: false },
  { value: "converted", label: "Converted", closes: true },
  { value: "not_interested", label: "Not interested", closes: true },
  { value: "do_not_contact", label: "Asked not to be contacted", closes: true },
];

export function stageForVerdict(verdict: FollowUpVerdict): LeadStage {
  if (verdict === "converted") return "won";
  if (verdict === "not_interested" || verdict === "do_not_contact") return "lost";
  return "contacted";
}

export interface FollowUp {
  id: string;
  /** ISO date this contact attempt happened. */
  date: string;
  verdict: FollowUpVerdict;
  note: string;
  /** Admin email who logged it (lib/admin/auth.ts session). */
  loggedBy: string;
  /** ISO date for the next attempt. Unset once a verdict has closed the lead. */
  nextFollowUpAt?: string;
}

export type LeadSource = "assessment" | "referral" | "website" | "walk_in" | "other";

export interface Lead {
  id: string;
  /** Set when this lead traces back to a real child profile / assessment —
   *  unset for a lead sales entered by hand with nothing behind it yet. */
  childId?: string;
  assessmentId?: string;
  childName: string;
  /** Filled in once someone has actually spoken to the parent. */
  parentName?: string;
  phone?: string;
  city?: string;
  source: LeadSource;
  stage: LeadStage;
  /** Free text — a rep's name/email. No user-management system to key against yet. */
  assignedTo?: string;
  nextFollowUpAt?: string;
  tags: string[];
  createdAt: string;
  /** Oldest first, so the timeline on the detail page reads top-to-bottom as history. */
  followUps: FollowUp[];
  /** True once a real record exists — false means what's shown is the
   *  computed default, not yet acted on. */
  isSaved: boolean;
}

export interface LeadInput {
  childId?: string;
  assessmentId?: string;
  childName: string;
  parentName?: string;
  phone?: string;
  city?: string;
  source: LeadSource;
  assignedTo?: string;
}

export interface FollowUpInput {
  date: string;
  verdict: FollowUpVerdict;
  note: string;
  loggedBy: string;
  nextFollowUpAt?: string;
}

function read(): Record<string, Lead> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(LEADS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function write(table: Record<string, Lead>): void {
  window.localStorage.setItem(LEADS_KEY, JSON.stringify(table));
}

function newId(): string {
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function syntheticLead(a: StoredAssessment): Promise<Lead> {
  const child = await getChild(a.child.id ?? "");
  return {
    id: a.id,
    childId: a.child.id,
    assessmentId: a.id,
    childName: a.child.name,
    phone: child?.phone ?? (a.child as any).phone,
    city: child?.city ?? a.child.city,
    source: "assessment",
    stage: "new",
    tags: [],
    createdAt: a.completedAt ?? a.assessedOn,
    followUps: [],
    isSaved: false,
  };
}

/**
 * Every lead worth showing a sales rep: real records first, then a synthetic
 * one for every completed assessment that hasn't been touched yet. Sorted so
 * the worklist is useful on its own — overdue and due-today follow-ups
 * first, then untouched new leads, then everything else by recency.
 */
export async function adminListLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed leads are not wired up yet.");
  }
  const saved = read();
  const savedByAssessment = new Set(
    Object.values(saved)
      .map((l) => l.assessmentId)
      .filter((id): id is string => !!id),
  );

  const list = await listAssessments();
  const synthetic = await Promise.all(list
    .filter((a) => a.completedAt && !savedByAssessment.has(a.id))
    .map(syntheticLead));

  const all = [...Object.values(saved), ...synthetic];
  const today = new Date().toISOString().slice(0, 10);

  return all.sort((a, b) => rank(a, today) - rank(b, today) || b.createdAt.localeCompare(a.createdAt));
}

/** Lower sorts first: overdue, then due today, then untouched new, then the rest, closed last. */
function rank(lead: Lead, today: string): number {
  if (lead.stage === "won" || lead.stage === "lost") return 4;
  if (lead.nextFollowUpAt && lead.nextFollowUpAt < today) return 0;
  if (lead.nextFollowUpAt === today) return 1;
  if (lead.stage === "new") return 2;
  return 3;
}

export async function adminGetLead(id: string): Promise<Lead | null> {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed leads are not wired up yet.");
  }
  const saved = read()[id];
  if (saved) return saved;

  const list = await listAssessments();
  const assessment = list.find((a) => a.id === id && a.completedAt);
  return assessment ? await syntheticLead(assessment) : null;
}

/** A lead sales starts by hand — a referral, a walk-in, an inbound call with no assessment yet. */
export function adminCreateLead(input: LeadInput): Lead {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed leads are not wired up yet.");
  }
  const table = read();
  const lead: Lead = {
    id: newId(),
    childId: input.childId,
    assessmentId: input.assessmentId,
    childName: input.childName,
    parentName: input.parentName,
    phone: input.phone,
    city: input.city,
    source: input.source,
    stage: "new",
    assignedTo: input.assignedTo,
    tags: [],
    createdAt: new Date().toISOString(),
    followUps: [],
    isSaved: true,
  };
  table[lead.id] = lead;
  write(table);
  return lead;
}

export async function adminUpdateLead(id: string, patch: Partial<LeadInput> & { tags?: string[] }): Promise<Lead> {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed leads are not wired up yet.");
  }
  const table = read();
  const existing = table[id] ?? await adminGetLead(id);
  if (!existing) throw new Error(`No lead ${id}`);
  const updated: Lead = { ...existing, ...patch, isSaved: true };
  table[id] = updated;
  write(table);
  return updated;
}

/**
 * The core action: log what happened on a call, and let the verdict decide
 * the lead's stage and whether it needs a next date. Materialises a synthetic
 * lead into a real record on first use.
 */
export async function adminLogFollowUp(id: string, input: FollowUpInput): Promise<Lead> {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed leads are not wired up yet.");
  }
  const table = read();
  const existing = table[id] ?? await adminGetLead(id);
  if (!existing) throw new Error(`No lead ${id}`);

  const verdictMeta = FOLLOW_UP_VERDICTS.find((v) => v.value === input.verdict)!;
  const followUp: FollowUp = {
    id: `fu-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    date: input.date,
    verdict: input.verdict,
    note: input.note,
    loggedBy: input.loggedBy,
    nextFollowUpAt: verdictMeta.closes ? undefined : input.nextFollowUpAt,
  };

  const updated: Lead = {
    ...existing,
    stage: stageForVerdict(input.verdict),
    nextFollowUpAt: followUp.nextFollowUpAt,
    followUps: [...existing.followUps, followUp],
    isSaved: true,
  };
  table[id] = updated;
  write(table);
  return updated;
}

/**
 * Removes the real record. For an assessment-derived lead this is a reset —
 * it reappears as an untouched synthetic lead next time, the assessment
 * itself is never affected. For a hand-created lead, this is the only copy,
 * so it is genuinely gone — the caller (ConfirmDeleteButton) already makes
 * that a deliberate two-click action.
 */
export function adminDeleteLead(id: string): void {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed leads are not wired up yet.");
  }
  const table = read();
  delete table[id];
  write(table);
}

export interface LeadStats {
  overdue: number;
  dueToday: number;
  open: number; // stage new or contacted
}

export async function adminLeadStats(): Promise<LeadStats> {
  const leads = isSupabaseConfigured() ? [] : await adminListLeads();
  const today = new Date().toISOString().slice(0, 10);
  return {
    overdue: leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt < today).length,
    dueToday: leads.filter((l) => l.nextFollowUpAt === today).length,
    open: leads.filter((l) => l.stage === "new" || l.stage === "contacted").length,
  };
}

export function useAdminLeads(): { leads: Lead[]; refresh: () => void } {
  const [leads, setLeads] = useState<Lead[]>([]);

  const refresh = useCallback(() => {
    if (isSupabaseConfigured()) return;
    adminListLeads().then(setLeads);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { leads, refresh };
}
