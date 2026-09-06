import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { BANK_VERSION } from "@/content/items";
import type { Assessment, Child, DomainCode, ResponseValue } from "@/lib/types";

export interface StoredAssessment extends Assessment {
  stagesByDomain: Record<DomainCode, string[]>;
  id: string;
}

export async function createAssessment(
  child: Child & { id: string },
  assessedOn: string,
  stagesByDomain: Record<DomainCode, string[]>
): Promise<StoredAssessment> {
  const supabase = getSupabaseBrowserClient();
  const startStage = Object.values(stagesByDomain)[0]?.[0] || ""; // Assuming all start at the same calculated stage
  
  const { data, error } = await supabase
    .from("assessments")
    .insert({
      child_id: child.id,
      assessed_on: assessedOn,
      start_stage: startStage,
      stages_by_domain: stagesByDomain,
      bank_version: BANK_VERSION,
      details: {}
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    child,
    assessedOn: data.assessed_on,
    stagesByDomain: data.stages_by_domain,
    responses: {},
    details: data.details,
    bankVersion: data.bank_version,
    completedAt: data.completed_at ?? undefined
  };
}

export async function getAssessment(id: string): Promise<StoredAssessment | null> {
  const supabase = getSupabaseBrowserClient();
  
  const { data: a, error: aError } = await supabase
    .from("assessments")
    .select("*, children(*)")
    .eq("id", id)
    .maybeSingle();

  if (aError || !a) return null;

  const { data: rData, error: rError } = await supabase
    .from("responses")
    .select("*")
    .eq("assessment_id", id);
    
  if (rError) throw rError;

  const responses: Record<string, ResponseValue> = {};
  for (const r of rData) {
    responses[r.item_id] = r.value as ResponseValue;
  }

  const child = Array.isArray(a.children) ? a.children[0] : a.children;

  return {
    id: a.id,
    child: {
      id: child.id,
      name: child.name,
      dob: child.dob,
      gender: child.gender as any,
      gestationalWeeks: child.gestational_weeks ?? undefined,
      city: child.city ?? undefined,
      photoUrl: child.photo_url ?? undefined
    },
    assessedOn: a.assessed_on,
    stagesByDomain: a.stages_by_domain,
    responses,
    details: a.details,
    bankVersion: a.bank_version,
    completedAt: a.completed_at ?? undefined
  };
}

export async function saveResponse(id: string, itemId: string, value: ResponseValue): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("responses")
    .upsert({
      assessment_id: id,
      item_id: itemId,
      value
    }, { onConflict: "assessment_id, item_id" });
    
  if (error) throw error;
}

export async function saveDetail(id: string, itemId: string, value: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error: getErr } = await supabase
    .from("assessments")
    .select("details")
    .eq("id", id)
    .single();
    
  if (getErr) throw getErr;

  const newDetails = { ...(data.details || {}), [itemId]: value };

  const { error: updErr } = await supabase
    .from("assessments")
    .update({ details: newDetails })
    .eq("id", id);
    
  if (updErr) throw updErr;
}

export async function appendStage(id: string, domain: DomainCode, stage: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error: getErr } = await supabase
    .from("assessments")
    .select("stages_by_domain")
    .eq("id", id)
    .single();
    
  if (getErr) throw getErr;

  const existing = data.stages_by_domain[domain] ?? [];
  if (existing.includes(stage)) return;

  const newStages = { ...data.stages_by_domain, [domain]: [...existing, stage] };

  const { error: updErr } = await supabase
    .from("assessments")
    .update({ stages_by_domain: newStages })
    .eq("id", id);
    
  if (updErr) throw updErr;
}

export async function completeAssessment(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("assessments")
    .update({
      status: "complete",
      completed_at: new Date().toISOString()
    })
    .eq("id", id);
    
  if (error) throw error;
}

export async function deleteAssessment(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("assessments")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}

export async function assessmentsForChild(childId: string): Promise<StoredAssessment[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: aData, error: aError } = await supabase
    .from("assessments")
    .select("*, children(*)")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
    
  if (aError) throw aError;
  if (!aData || aData.length === 0) return [];
  
  const { data: rData, error: rError } = await supabase
    .from("responses")
    .select("*")
    .in("assessment_id", aData.map(a => a.id));
    
  if (rError) throw rError;
  
  const responsesByAssessment: Record<string, Record<string, ResponseValue>> = {};
  for (const r of rData) {
    if (!responsesByAssessment[r.assessment_id]) {
      responsesByAssessment[r.assessment_id] = {};
    }
    responsesByAssessment[r.assessment_id][r.item_id] = r.value as ResponseValue;
  }
  
  return aData.map(a => {
    const child = Array.isArray(a.children) ? a.children[0] : a.children;
    return {
      id: a.id,
      child: {
        id: child.id,
        name: child.name,
        dob: child.dob,
        gender: child.gender as any,
        gestationalWeeks: child.gestational_weeks ?? undefined,
        city: child.city ?? undefined,
        photoUrl: child.photo_url ?? undefined
      },
      assessedOn: a.assessed_on,
      stagesByDomain: a.stages_by_domain,
      responses: responsesByAssessment[a.id] || {},
      details: a.details,
      bankVersion: a.bank_version,
      completedAt: a.completed_at ?? undefined
    };
  });
}

export async function latestAssessmentForChild(childId: string): Promise<StoredAssessment | null> {
  const all = await assessmentsForChild(childId);
  return all.find((a) => a.completedAt) ?? all[0] ?? null;
}

export async function listAssessments(): Promise<StoredAssessment[]> {
  const supabase = getSupabaseBrowserClient();
  const { data: aData, error: aError } = await supabase
    .from("assessments")
    .select("*, children(*)")
    .order("created_at", { ascending: false });
    
  if (aError) throw aError;
  if (!aData || aData.length === 0) return [];
  
  const { data: rData, error: rError } = await supabase
    .from("responses")
    .select("*")
    .in("assessment_id", aData.map((a: any) => a.id));
    
  if (rError) throw rError;
  
  const responsesByAssessment: Record<string, Record<string, ResponseValue>> = {};
  for (const r of rData) {
    if (!responsesByAssessment[r.assessment_id]) {
      responsesByAssessment[r.assessment_id] = {};
    }
    responsesByAssessment[r.assessment_id][r.item_id] = r.value as ResponseValue;
  }
  
  return aData.map((a: any) => {
    const child = Array.isArray(a.children) ? a.children[0] : a.children;
    return {
      id: a.id,
      child: {
        id: child.id,
        name: child.name,
        dob: child.dob,
        gender: child.gender as any,
        gestationalWeeks: child.gestational_weeks ?? undefined,
        city: child.city ?? undefined,
        photoUrl: child.photo_url ?? undefined
      },
      assessedOn: a.assessed_on,
      stagesByDomain: a.stages_by_domain,
      responses: responsesByAssessment[a.id] || {},
      details: a.details,
      bankVersion: a.bank_version,
      completedAt: a.completed_at ?? undefined
    };
  });
}
