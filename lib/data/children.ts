import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Child } from "@/lib/types";

export type SavedChild = Child & { id: string; createdAt: string; profile_id: string };

export async function createChild(input: Omit<Child, "id" | "createdAt">): Promise<SavedChild> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("children")
    .insert({
      profile_id: user.id,
      name: input.name,
      dob: input.dob,
      gender: input.gender,
      gestational_weeks: input.gestationalWeeks ?? null,
      city: input.city ?? null,
      photo_url: input.photoUrl ?? null
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    id: data.id,
    profile_id: data.profile_id,
    name: data.name,
    dob: data.dob,
    gender: data.gender as any,
    gestationalWeeks: data.gestational_weeks ?? undefined,
    city: data.city ?? undefined,
    photoUrl: data.photo_url ?? undefined,
    createdAt: data.created_at
  };
}

export async function listChildren(): Promise<SavedChild[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error("listChildren failed: " + (error.message || JSON.stringify(error)));

  return data.map(d => ({
    id: d.id,
    profile_id: d.profile_id,
    name: d.name,
    dob: d.dob,
    gender: d.gender as any,
    gestationalWeeks: d.gestational_weeks ?? undefined,
    city: d.city ?? undefined,
    photoUrl: d.photo_url ?? undefined,
    createdAt: d.created_at
  }));
}

export async function getChild(id: string): Promise<SavedChild | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    profile_id: data.profile_id,
    name: data.name,
    dob: data.dob,
    gender: data.gender as any,
    gestationalWeeks: data.gestational_weeks ?? undefined,
    city: data.city ?? undefined,
    photoUrl: data.photo_url ?? undefined,
    createdAt: data.created_at
  };
}

export async function updateChild(id: string, patch: Partial<Child>): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const updateData: any = {};
  if (patch.name !== undefined) updateData.name = patch.name;
  if (patch.dob !== undefined) updateData.dob = patch.dob;
  if (patch.gender !== undefined) updateData.gender = patch.gender;
  if (patch.gestationalWeeks !== undefined) updateData.gestational_weeks = patch.gestationalWeeks ?? null;
  if (patch.city !== undefined) updateData.city = patch.city ?? null;
  if (patch.photoUrl !== undefined) updateData.photo_url = patch.photoUrl ?? null;

  const { error } = await supabase
    .from("children")
    .update(updateData)
    .eq("id", id);
    
  if (error) throw error;
}

export async function deleteChild(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("children")
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}
