/**
 * Admin data access — reads from Supabase (the anon key respects RLS,
 * so admin users see all rows via the is_admin() policy).
 */
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { listAssessments, listChildren, getAssessment, type StoredAssessment } from "@/lib/store";
import { scoreAssessment } from "@/lib/scoring";
import type { AssessmentResult } from "@/lib/types";

export interface AdminSubmission {
  assessment: StoredAssessment;
  result: AssessmentResult | null;
}

function toSubmission(a: StoredAssessment): AdminSubmission {
  let result: AssessmentResult | null = null;
  try {
    result = scoreAssessment({
      child: a.child,
      assessedOn: a.assessedOn,
      responses: a.responses,
      details: a.details,
      stagesByDomain: a.stagesByDomain,
    });
  } catch {
    // Incomplete/malformed response sets score fine in practice, but this
    // list must never break on one bad row.
  }
  return { assessment: a, result };
}

export async function adminListSubmissions(): Promise<AdminSubmission[]> {
  try {
    const list = await listAssessments();
    return list.map(toSubmission);
  } catch (err: any) {
    throw new Error("Failed to list submissions: " + (err?.message ?? JSON.stringify(err)));
  }
}

export async function adminGetSubmission(id: string): Promise<AdminSubmission | null> {
  try {
    const a = await getAssessment(id);
    return a ? toSubmission(a) : null;
  } catch (err: any) {
    throw new Error("Failed to get submission: " + (err?.message ?? JSON.stringify(err)));
  }
}

export interface AdminDashboardCounts {
  totalParents: number;
  totalChildren: number;
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  totalPurchases: number;
  needsFollowUp: number;
}

export async function adminDashboardCounts(): Promise<AdminDashboardCounts> {
  try {
    const supabase = getSupabaseBrowserClient();

    const [
      { count: parentsCount, error: pErr },
      { count: purchasesCount, error: pyErr },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "paid"),
    ]);

    if (pErr) throw new Error("profiles count failed: " + pErr.message);
    if (pyErr) throw new Error("payments count failed: " + pyErr.message);

    const children = await listChildren();
    const list = await listAssessments();
    const submissions = list.map(toSubmission);

    return {
      totalParents: parentsCount ?? 0,
      totalChildren: children.length,
      totalAssessments: submissions.length,
      completedAssessments: submissions.filter((s) => s.assessment.completedAt).length,
      inProgressAssessments: submissions.filter((s) => !s.assessment.completedAt).length,
      totalPurchases: purchasesCount ?? 0,
      needsFollowUp: submissions.filter((s) => {
        const st = s.result?.overallStatus;
        return st === "significant" || st === "delay";
      }).length,
    };
  } catch (err: any) {
    throw new Error("Failed to load dashboard counts: " + (err?.message ?? JSON.stringify(err)));
  }
}
