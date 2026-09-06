import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  MilestoneVideo,
  MilestoneVideoInput,
} from "@/lib/types/recommendations";

// ---------------------------------------------------------------------------
// Client-side functions — used by the report page
// ---------------------------------------------------------------------------

/**
 * Returns all *active* milestone-video cards for a given (stage, domain) cell,
 * ordered by sort_order ascending. Used when rendering the report page.
 */
export async function getMilestoneVideos(
  stageId: string,
  domain: string
): Promise<MilestoneVideo[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("milestone_videos")
    .select("*")
    .eq("stage_id", stageId)
    .eq("domain", domain as import("@/lib/supabase/database.types").MilestoneVideoDomain)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch milestone videos: ${error.message}`);
  return data as MilestoneVideo[];
}

// ---------------------------------------------------------------------------
// Admin CMS functions — used by the admin milestone-videos CMS page
// ---------------------------------------------------------------------------

/**
 * Returns ALL milestone-video records (including inactive ones), ordered by
 * stage_id → domain → sort_order. Used by the admin CMS page to render the
 * full grouped list for editing.
 */
export async function listAllMilestoneVideos(): Promise<MilestoneVideo[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("milestone_videos")
    .select("*")
    .order("stage_id", { ascending: true })
    .order("domain", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to list milestone videos: ${error.message}`);
  return data as MilestoneVideo[];
}

/**
 * Creates a new milestone-video record. Returns the newly created row.
 */
export async function createMilestoneVideo(
  input: MilestoneVideoInput
): Promise<MilestoneVideo> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("milestone_videos")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(`Failed to create milestone video: ${error.message}`);
  return data as MilestoneVideo;
}

/**
 * Partially updates an existing milestone-video record by id.
 * Returns the updated row.
 */
export async function updateMilestoneVideo(
  id: string,
  input: Partial<MilestoneVideoInput>
): Promise<MilestoneVideo> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("milestone_videos")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update milestone video: ${error.message}`);
  return data as MilestoneVideo;
}

/**
 * Permanently deletes a milestone-video record by id.
 */
export async function deleteMilestoneVideo(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("milestone_videos")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete milestone video: ${error.message}`);
}

/**
 * Toggles the is_active flag on a single milestone-video record.
 * Pass `isActive = true` to publish, `false` to unpublish.
 */
export async function toggleMilestoneVideoActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("milestone_videos")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error)
    throw new Error(`Failed to toggle milestone video active state: ${error.message}`);
}
