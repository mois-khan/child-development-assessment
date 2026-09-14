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

/** A single student on a school's roster, as the admin detail page shows it —
 * the guardian fields (parent_name/parent_phone/parent_email) describe the
 * child's actual guardian, independent of the school account that owns the
 * row (see children.profile_id in 0007_schools.sql / 0013_child_parent_name.sql). */
export interface AdminSchoolStudent {
  id: string;
  name: string;
  dob: string;
  gender: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  completedCount: number;
  inProgressCount: number;
  lastAssessmentId: string | null;
  lastAssessedOn: string | null;
}

export interface AdminSchoolDetail extends AdminSchool {
  students: AdminSchoolStudent[];
}

/**
 * One school plus its full student roster, for the admin detail page
 * (/admin/schools/[id]). Reuses listSchools() for the header fields rather
 * than duplicating that join, then adds the one query listSchools()
 * deliberately skips: the actual children rows.
 */
export async function getSchoolDetail(schoolId: string): Promise<AdminSchoolDetail | null> {
  const supabase = getSupabaseBrowserClient();

  const schools = await listSchools();
  const school = schools.find((s) => s.id === schoolId);
  if (!school) return null;

  const { data, error } = await supabase
    .from("children")
    .select("id, name, dob, gender, parent_name, parent_phone, parent_email, assessments(id, assessed_on, completed_at)")
    .eq("profile_id", schoolId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to fetch students: ${error.message}`);

  const students: AdminSchoolStudent[] = (data ?? []).map((c: any) => {
    const completed = c.assessments.filter((a: any) => a.completed_at);
    const inProgress = c.assessments.filter((a: any) => !a.completed_at);
    const last = [...c.assessments].sort((a: any, b: any) => b.assessed_on.localeCompare(a.assessed_on))[0];
    return {
      id: c.id,
      name: c.name,
      dob: c.dob,
      gender: c.gender,
      guardianName: c.parent_name ?? "",
      guardianPhone: c.parent_phone ?? "",
      guardianEmail: c.parent_email ?? "",
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      lastAssessmentId: last?.id ?? null,
      lastAssessedOn: last?.assessed_on ?? null,
    };
  });

  return { ...school, students };
}

export interface InviteSchoolInput {
  email: string;
  password: string;
  schoolName: string;
  contactName: string;
  contactPhone: string;
}

/**
 * Creates a new school account, password included, via the Next.js API
 * route `/api/admin/invite-school` — the privileged Supabase admin call has
 * to happen server-side, same reasoning as inviteAdminUser() in
 * lib/data/rbac.ts. The school can sign in with this password right away;
 * it isn't sent anywhere by this call, so the caller is responsible for
 * handing it to the school.
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

/**
 * Sets a new password for an existing school account, via
 * `/api/admin/reset-school-password` — the "resend credentials" action.
 * There's no way to recover the original password (Supabase only stores its
 * hash), so this generates and shares a new one instead.
 */
export async function resetSchoolPassword(schoolId: string, password: string): Promise<void> {
  const response = await fetch("/api/admin/reset-school-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schoolId, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Failed to reset password: ${body?.error ?? response.statusText}`);
  }
}
