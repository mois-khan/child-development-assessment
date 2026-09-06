import type { DomainCode } from "@/lib/types";

/**
 * A single milestone video card shown in the report for a specific
 * (stage, domain) cell. Authored and managed by admin via the CMS.
 */
export interface MilestoneVideo {
  id: string;
  /** Matches a brain stage id from content/stages.ts, e.g. "s3". */
  stage_id: string;
  /** The six competence codes from lib/types.ts. */
  domain: DomainCode;
  title: string;
  description: string;
  thumbnail_url: string;
  /** Where clicking the card takes the parent (opens in new tab). */
  redirect_url: string;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * A course recommendation card shown at the bottom of the report,
 * based on the child's overall achieved brain stage. Authored by admin.
 */
export interface CourseRecommendation {
  id: string;
  /** Overall brain stage this course targets, e.g. "s3". */
  stage_id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnail_url: string;
  /** Where clicking the card takes the parent (opens in new tab). */
  redirect_url: string;
  /** Human-readable age range shown on the card, e.g. "0–3 months". */
  age_label: string;
  sort_order: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Input type for creating or updating a milestone video. */
export type MilestoneVideoInput = Omit<
  MilestoneVideo,
  "id" | "created_by" | "created_at" | "updated_at"
>;

/** Input type for creating or updating a course recommendation. */
export type CourseRecommendationInput = Omit<
  CourseRecommendation,
  "id" | "created_by" | "created_at" | "updated_at"
>;
