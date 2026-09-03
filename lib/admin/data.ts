/**
 * Admin data access.
 *
 * Same fallback shape as lib/admin/auth.ts: when Supabase isn't configured
 * yet, these read straight from the same localStorage the parent-facing app
 * already writes to (lib/store.ts) — so submissions created while testing
 * the parent flow show up here immediately, in the same browser. Once
 * credentials are added, isSupabaseConfigured() flips these to real queries
 * against every parent's data, not just this browser's.
 */
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { listAssessments, listChildren, getAssessment, type StoredAssessment } from "@/lib/store";
import type { SavedChild } from "@/lib/store";
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
    // list must never break on one bad row — the admin still needs to see
    // (and open) every other submission.
  }
  return { assessment: a, result };
}

export async function adminListSubmissions(): Promise<AdminSubmission[]> {
  if (isSupabaseConfigured()) {
    // TODO: once credentials exist, query assessments (+ responses,
    // domain_scores, results) directly rather than recomputing scores
    // client-side. Wiring this against a live schema now, before there is
    // one to test against, would just be code no one has run.
    throw new Error("Supabase-backed submissions are not wired up yet.");
  }
  return listAssessments().map(toSubmission);
}

export async function adminGetSubmission(id: string): Promise<AdminSubmission | null> {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed submissions are not wired up yet.");
  }
  const a = getAssessment(id);
  return a ? toSubmission(a) : null;
}

export interface AdminDashboardCounts {
  totalChildren: number;
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  needsFollowUp: number; // overallStatus === "consult"
}

export async function adminDashboardCounts(): Promise<AdminDashboardCounts> {
  if (isSupabaseConfigured()) {
    throw new Error("Supabase-backed dashboard is not wired up yet.");
  }
  const children: SavedChild[] = listChildren();
  const submissions = listAssessments().map(toSubmission);
  return {
    totalChildren: children.length,
    totalAssessments: submissions.length,
    completedAssessments: submissions.filter((s) => s.assessment.completedAt).length,
    inProgressAssessments: submissions.filter((s) => !s.assessment.completedAt).length,
    needsFollowUp: submissions.filter((s) => s.result?.overallStatus === "consult").length,
  };
}
