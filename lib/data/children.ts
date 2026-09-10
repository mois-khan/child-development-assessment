import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import type { Child } from "@/lib/types";

type ChildRow = Database["public"]["Tables"]["children"]["Row"];
type ChildWrite = Database["public"]["Tables"]["children"]["Update"];

export type SavedChild = Child & { id: string; createdAt: string; profile_id: string };

/**
 * One database row → one Child, in one place.
 *
 * This used to be written out three times (create, list, get). When the
 * children table gained no `phone` column, the add-child form went on
 * collecting a phone number and all three mappings went on quietly not
 * returning one — the field existed in the form and in the type, and nowhere
 * in between. Three copies of a mapping is three chances to forget a column;
 * this is one.
 */
function rowToChild(d: ChildRow): SavedChild {
  return {
    id: d.id,
    profile_id: d.profile_id,
    name: d.name,
    dob: d.dob,
    gender: d.gender,
    gestationalWeeks: d.gestational_weeks ?? undefined,
    city: d.city ?? undefined,
    parentPhone: d.parent_phone ?? undefined,
    parentEmail: d.parent_email ?? undefined,
    photoUrl: d.photo_url ?? undefined,
    createdAt: d.created_at,
  };
}

/** The reverse: a Child's editable fields → the columns they live in. */
function childToRow(patch: Partial<Child>): ChildWrite {
  const row: ChildWrite = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.dob !== undefined) row.dob = patch.dob;
  if (patch.gender !== undefined) row.gender = patch.gender;
  if (patch.gestationalWeeks !== undefined) row.gestational_weeks = patch.gestationalWeeks ?? null;
  if (patch.city !== undefined) row.city = patch.city ?? null;
  if (patch.parentPhone !== undefined) row.parent_phone = patch.parentPhone ?? null;
  if (patch.parentEmail !== undefined) row.parent_email = patch.parentEmail ?? null;
  if (patch.photoUrl !== undefined) row.photo_url = patch.photoUrl ?? null;
  return row;
}

export async function createChild(input: Omit<Child, "id" | "createdAt">): Promise<SavedChild> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("children")
    .insert({
      profile_id: user.id,
      // name/dob are required on insert; childToRow types them optional
      // because it also serves updateChild, where a partial patch is valid.
      name: input.name,
      dob: input.dob,
      ...childToRow(input),
    })
    .select()
    .single();

  if (error) throw error;
  return rowToChild(data);
}

export async function listChildren(): Promise<SavedChild[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error("listChildren failed: " + (error.message || JSON.stringify(error)));

  return data.map(rowToChild);
}

export async function getChild(id: string): Promise<SavedChild | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToChild(data);
}

export async function updateChild(id: string, patch: Partial<Child>): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("children").update(childToRow(patch)).eq("id", id);
  if (error) throw error;
}

/**
 * Delete a child and, by cascade, every assessment and answer belonging to
 * them. `children.id` is referenced ON DELETE CASCADE from assessments (and
 * responses through those), so this is not recoverable from the app — the
 * caller is responsible for asking first.
 */
export async function deleteChild(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("children").delete().eq("id", id);
  if (error) throw error;
}
