import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * A school account as the admin panel lists it — the schools row plus the
 * roster count and the login email, which live on two other tables (schools
 * has no email of its own; that's on profiles, the account it extends).
 */
export interface AdminSchool {
  id: string;
  email: string;
  schoolName: string;
  contactName: string;
  contactPhone: string;
  city: string;
  studentCount: number;
  createdAt: string;
}

/**
 * Every school account, newest first, each with its student count.
 *
 * Three small queries joined client-side rather than one view: schools and
 * profiles are both tiny tables an admin will have dozens of, not thousands,
 * so the round trips cost nothing and this stays readable without adding a
 * SQL view purely for one admin page.
 */
export async function listSchools(): Promise<AdminSchool[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: schools, error: schoolsError } = await supabase
    .from("schools")
    .select("id, school_name, contact_name, contact_phone, city, created_at")
    .order("created_at", { ascending: false });
  if (schoolsError) throw new Error(`Failed to fetch schools: ${schoolsError.message}`);
  if (!schools || schools.length === 0) return [];

  const ids = schools.map((s) => s.id);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email")
    .in("id", ids);
  if (profilesError) throw new Error(`Failed to fetch school emails: ${profilesError.message}`);
  const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email as string]));

  const { data: children, error: childrenError } = await supabase
    .from("children")
    .select("profile_id")
    .in("profile_id", ids);
  if (childrenError) throw new Error(`Failed to fetch student counts: ${childrenError.message}`);
  const countById = new Map<string, number>();
  for (const c of children ?? []) {
    countById.set(c.profile_id, (countById.get(c.profile_id) ?? 0) + 1);
  }

  return schools.map((s) => ({
    id: s.id,
    email: emailById.get(s.id) ?? "",
    schoolName: s.school_name,
    contactName: s.contact_name,
    contactPhone: s.contact_phone,
    city: s.city,
    studentCount: countById.get(s.id) ?? 0,
    createdAt: s.created_at,
  }));
}

export interface InviteSchoolInput {
  email: string;
  schoolName: string;
  contactName: string;
  contactPhone: string;
}

/**
 * Invites a new school account via the Next.js API route
 * `/api/admin/invite-school` — the privileged Supabase admin-invite call
 * has to happen server-side, same reasoning as inviteAdminUser() in
 * lib/data/rbac.ts.
 */
export async function inviteSchool(input: InviteSchoolInput): Promise<void> {
  const response = await fetch("/api/admin/invite-school", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Failed to invite school: ${body?.error ?? response.statusText}`);
  }
}
