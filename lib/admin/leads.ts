import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { type AssessmentResult, type StatusCode } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type LeadStatus = "new" | "contacted" | "interested" | "follow_up" | "converted" | "not_interested" | "lost";
export type InteractionChannel = "phone" | "whatsapp" | "email" | "sms" | "in_person" | "other";
export type InteractionOutcome = "interested" | "not_interested" | "call_back" | "info_requested" | "payment_discussion" | "assessment_discussion" | "converted" | "no_response" | "other";

export interface Interaction {
  id: string;
  occurredAt: string;
  channel: InteractionChannel;
  outcome: InteractionOutcome;
  remarks: string;
  nextFollowUpAt?: string;
  loggedByEmail?: string;
}

export interface LeadChildAssessment {
  id: string;
  assessedOn: string;
  completedAt?: string;
  result?: AssessmentResult;
}

export interface LeadChild {
  id: string;
  name: string;
  dob: string;
  assessments: LeadChildAssessment[];
}

export interface Lead {
  id: string;
  profileId: string;
  parentName: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  assignedToEmail?: string;
  nextFollowUpAt?: string;
  lastInteractionAt?: string;
  createdAt: string;
  children: LeadChild[];
  interactions: Interaction[];
}

export interface LeadStats {
  overdue: number;
  dueToday: number;
  open: number;
}

export async function adminListLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = getSupabaseBrowserClient();
  const { data: leadsData, error } = await (supabase
    .from("leads")
    .select(`
      id, profile_id, status, source, next_follow_up_at, last_interaction_at, created_at,
      profiles ( full_name, phone, email ),
      admin_users ( email )
    ` as any)
    .order("next_follow_up_at", { ascending: true, nullsFirst: false }) as any);
  if (error) throw error;

  const profileIds = leadsData.map((l: any) => l.profile_id);
  
  // Fetch children for these profiles
  const { data: childrenData, error: childErr } = await (supabase
    .from("children")
    .select(`
      id, profile_id, name, dob,
      assessments ( id, assessed_on, completed_at, result )
    ` as any)
    .in("profile_id", profileIds) as any);
  if (childErr) throw childErr;

  const childrenByProfile = new Map<string, LeadChild[]>();
  for (const child of childrenData || []) {
    if (!childrenByProfile.has(child.profile_id)) childrenByProfile.set(child.profile_id, []);
    childrenByProfile.get(child.profile_id)!.push({
      id: child.id,
      name: child.name,
      dob: child.dob,
      assessments: (child.assessments || []).map((a: any) => ({
        id: a.id,
        assessedOn: a.assessed_on,
        completedAt: a.completed_at || undefined,
        result: a.result || undefined
      }))
    });
  }

  return leadsData.map((l: any): Lead => ({
    id: l.id,
    profileId: l.profile_id,
    parentName: l.profiles?.full_name || "",
    phone: l.profiles?.phone || "",
    email: l.profiles?.email || "",
    source: l.source,
    status: l.status,
    assignedToEmail: l.admin_users?.email,
    nextFollowUpAt: l.next_follow_up_at || undefined,
    lastInteractionAt: l.last_interaction_at || undefined,
    createdAt: l.created_at,
    children: childrenByProfile.get(l.profile_id) || [],
    interactions: []
  }));
}

export async function adminGetLead(id: string): Promise<Lead | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  const { data: l, error } = await (supabase
    .from("leads")
    .select(`
      id, profile_id, status, source, next_follow_up_at, last_interaction_at, created_at,
      profiles ( full_name, phone, email ),
      admin_users ( email )
    ` as any)
    .eq("id", id)
    .single() as any);
  if (error) return null;

  const { data: childrenData } = await (supabase
    .from("children")
    .select(`
      id, profile_id, name, dob,
      assessments ( id, assessed_on, completed_at, result )
    ` as any)
    .eq("profile_id", l.profile_id) as any);

  const children: LeadChild[] = (childrenData || []).map((child: any) => ({
    id: child.id,
    name: child.name,
    dob: child.dob,
    assessments: (child.assessments || []).map((a: any) => ({
      id: a.id,
      assessedOn: a.assessed_on,
      completedAt: a.completed_at || undefined,
      result: a.result || undefined
    }))
  }));

  const { data: interactionsData } = await (supabase
    .from("interactions")
    .select(`
      id, occurred_at, channel, outcome, remarks, next_follow_up_at,
      admin_users ( email )
    ` as any)
    .eq("lead_id", l.id)
    .order("occurred_at", { ascending: false }) as any);

  const interactions: Interaction[] = (interactionsData || []).map((i: any) => ({
    id: i.id,
    occurredAt: i.occurred_at,
    channel: i.channel,
    outcome: i.outcome,
    remarks: i.remarks,
    nextFollowUpAt: i.next_follow_up_at || undefined,
    loggedByEmail: i.admin_users?.email
  }));

  return {
    id: l.id,
    profileId: l.profile_id,
    parentName: l.profiles?.full_name || "",
    phone: l.profiles?.phone || "",
    email: l.profiles?.email || "",
    source: l.source,
    status: l.status,
    assignedToEmail: l.admin_users?.email,
    nextFollowUpAt: l.next_follow_up_at || undefined,
    lastInteractionAt: l.last_interaction_at || undefined,
    createdAt: l.created_at,
    children,
    interactions
  };
}

export async function adminUpdateLead(id: string, patch: { parentName?: string; phone?: string; email?: string }): Promise<Lead> {
  const supabase = getSupabaseBrowserClient();
  const lead = await adminGetLead(id);
  if (!lead) throw new Error("Lead not found");

  if (patch.parentName !== undefined || patch.phone !== undefined || patch.email !== undefined) {
    await supabase.from("profiles").update({
      full_name: patch.parentName ?? lead.parentName,
      phone: patch.phone ?? lead.phone,
      email: patch.email ?? lead.email
    }).eq("id", lead.profileId);
  }
  
  return adminGetLead(id) as Promise<Lead>;
}

export async function adminLogInteraction(id: string, input: {
  channel: InteractionChannel;
  outcome: InteractionOutcome;
  remarks: string;
  nextFollowUpAt?: string;
  loggedByUserId: string;
}): Promise<Lead> {
  const supabase = getSupabaseBrowserClient();
  
  const { error } = await supabase.from("interactions").insert({
    lead_id: id,
    channel: input.channel,
    outcome: input.outcome,
    remarks: input.remarks,
    next_follow_up_at: input.nextFollowUpAt || null,
    logged_by: input.loggedByUserId
  });
  if (error) throw error;
  
  return adminGetLead(id) as Promise<Lead>;
}

export async function adminLeadStats(): Promise<LeadStats> {
  const leads = await adminListLeads();
  const today = new Date().toISOString().slice(0, 10);
  return {
    overdue: leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt < today).length,
    dueToday: leads.filter((l) => l.nextFollowUpAt?.startsWith(today)).length,
    open: leads.filter((l) => l.status === "new" || l.status === "contacted").length,
  };
}

import { useState, useCallback, useEffect } from "react";
export function useAdminLeads(): { leads: Lead[]; refresh: () => void } {
  const [leads, setLeads] = useState<Lead[]>([]);
  const refresh = useCallback(() => { adminListLeads().then(setLeads); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { leads, refresh };
}

