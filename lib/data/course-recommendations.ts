import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CourseRecommendation,
  CourseRecommendationInput,
} from "@/lib/types/recommendations";

// ---------------------------------------------------------------------------
// Client-side functions — used by the report page
// ---------------------------------------------------------------------------

/**
 * Returns all *active* course-recommendation cards for a given brain stage,
 * ordered by sort_order ascending. Used when rendering the report page.
 */
export async function getCourseRecommendations(
  stageId: string
): Promise<CourseRecommendation[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("course_recommendations")
    .select("*")
    .eq("stage_id", stageId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error)
    throw new Error(`Failed to fetch course recommendations: ${error.message}`);
  return data as CourseRecommendation[];
}

// ---------------------------------------------------------------------------
// Admin CMS functions — used by the admin course-recommendations CMS page
// ---------------------------------------------------------------------------

/**
 * Returns ALL course-recommendation records (including inactive ones), ordered
 * by stage_id → sort_order. Used by the admin CMS page to render the full
 * grouped list for editing.
 */
export async function listAllCourseRecommendations(): Promise<CourseRecommendation[]> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("course_recommendations")
    .select("*")
    .order("stage_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error)
    throw new Error(`Failed to list course recommendations: ${error.message}`);
  return data as CourseRecommendation[];
}

/**
 * Creates a new course-recommendation record. Returns the newly created row.
 */
export async function createCourseRecommendation(
  input: CourseRecommendationInput
): Promise<CourseRecommendation> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("course_recommendations")
    .insert(input)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to create course recommendation: ${error.message}`);
  return data as CourseRecommendation;
}

/**
 * Partially updates an existing course-recommendation record by id.
 * Returns the updated row.
 */
export async function updateCourseRecommendation(
  id: string,
  input: Partial<CourseRecommendationInput>
): Promise<CourseRecommendation> {
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from("course_recommendations")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error)
    throw new Error(`Failed to update course recommendation: ${error.message}`);
  return data as CourseRecommendation;
}

/**
 * Permanently deletes a course-recommendation record by id.
 */
export async function deleteCourseRecommendation(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("course_recommendations")
    .delete()
    .eq("id", id);

  if (error)
    throw new Error(`Failed to delete course recommendation: ${error.message}`);
}

/**
 * Toggles the is_active flag on a single course-recommendation record.
 * Pass `isActive = true` to publish, `false` to unpublish.
 */
export async function toggleCourseRecommendationActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  const { error } = await supabase
    .from("course_recommendations")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error)
    throw new Error(
      `Failed to toggle course recommendation active state: ${error.message}`
    );
}
