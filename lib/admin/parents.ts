/**
 * One parent's complete picture — contact details, lead status, and every
 * child they've added with the assessments those children have taken. Feeds
 * the profile popup on the admin Parents page.
 */
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatAge, summariseAge, todayISO } from "@/lib/age";
import { stageForAge } from "@/lib/stage";
import { phaseLabel } from "@/lib/naming";
import type { LeadStatus } from "./leads";

export interface ParentChildAssessment {
  id: string;
  assessedOn: string;
  completedAt?: string;
}

export interface ParentChild {
  id: string;
  name: string;
  dob: string;
  ageLabel: string;
  stageLabel: string;
  assessments: ParentChildAssessment[];
}

export interface ParentProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
  leadId?: string;
  leadStatus?: LeadStatus;
  children: ParentChild[];
  totalAssessments: number;
  completedAssessments: number;
}

export async function adminGetParentProfile(profileId: string): Promise<ParentProfile | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: p, error } = await (supabase
    .from("profiles")
    .select(`
      id, full_name, phone, email, created_at,
      leads ( id, status ),
      children (
        id, name, dob, gestational_weeks,
        assessments ( id, assessed_on, completed_at )
      )
    ` as any)
    .eq("id", profileId)
    .maybeSingle() as any);

  if (error || !p) return null;

  const today = todayISO();
  const children: ParentChild[] = (p.children ?? []).map((c: any) => {
    const age = summariseAge(c.dob, today, c.gestational_weeks ?? undefined);
    const stage = stageForAge(age.assessedMonths);
    const assessments: ParentChildAssessment[] = (c.assessments ?? [])
      .map((a: any) => ({
        id: a.id,
        assessedOn: a.assessed_on,
        completedAt: a.completed_at ?? undefined,
      }))
      .sort((a: ParentChildAssessment, b: ParentChildAssessment) => b.assessedOn.localeCompare(a.assessedOn));
    return {
      id: c.id,
      name: c.name,
      dob: c.dob,
      ageLabel: formatAge(age.chronologicalMonths),
      stageLabel: phaseLabel(stage),
      assessments,
    };
  });

  const allAssessments = children.flatMap((c) => c.assessments);

  return {
    id: p.id,
    fullName: p.full_name || "",
    phone: p.phone || "",
    email: p.email || "",
    createdAt: p.created_at,
    leadId: p.leads?.[0]?.id,
    leadStatus: p.leads?.[0]?.status,
    children,
    totalAssessments: allAssessments.length,
    completedAssessments: allAssessments.filter((a) => a.completedAt).length,
  };
}
