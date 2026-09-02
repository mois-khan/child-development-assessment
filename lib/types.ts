/**
 * Core domain types for the Kaushalya milestone screener.
 *
 * Everything in `content/` is data, not code: the item bank, the activities
 * and the domain/band definitions are all plain objects so they can be moved
 * into Supabase tables (see supabase/migrations) and edited by the child
 * development team without a deploy.
 */

export type DomainCode =
  | "auditory"
  | "vision"
  | "mobility"
  | "hand"
  | "language"
  | "social";

export interface Domain {
  code: DomainCode;
  /** Short parent-facing name, used on report cards. */
  name: string;
  /** One word, for chart axes and other places the full name will not fit. */
  short: string;
  /** One sentence a parent can understand, shown under the name. */
  blurb: string;
  /** What the domain covers, in professional terms. For the handoff/PDF. */
  scope: string;
  /** Hue used for this domain's chart series and card accent. */
  hue: number;
  order: number;
  /** True while this section's real content is still a stand-in — see content/domains.ts. */
  placeholder?: boolean;
}

/**
 * One of the programme's seven phases of brain development (Phase I-VII).
 * Presentation-layer only — see content/domains.ts for how it relates to the
 * scoring engine's thirteen age bands.
 */
export interface Module {
  id: number;
  /** Roman numeral, as the programme names its phases (I-VII). */
  phase: string;
  name: string;
  minMonths: number;
  maxMonths: number;
}

export interface AgeBand {
  id: string;
  label: string;
  minMonths: number;
  /** Inclusive upper bound. A child of exactly this age is still in the band. */
  maxMonths: number;
  order: number;
}

export type ItemSource = "CDC" | "NIDCD" | "WHO" | "AUTHORED";

export interface Item {
  id: string;
  domain: DomainCode;
  band: string;
  /** The question as the parent reads it. */
  text: string;
  /** Concrete instruction so the parent tests rather than recalls. */
  how: string;
  source: ItemSource;
}

/** Yes = 2, Sometimes = 1, Not yet = 0. Unanswered items leave the denominator. */
export type ResponseValue = 0 | 1 | 2;

export interface Activity {
  id: string;
  domain: DomainCode;
  /** Activities are written per stage, not per band — see content/activities.ts */
  stage: string;
  title: string;
  description: string;
  materials: string;
  minutes: number;
  frequency: string;
}

export type Gender = "girl" | "boy" | "other";

export interface Child {
  /** Set by lib/store.ts createChild — optional here so the scoring engine
   * (which only needs dob/gender) can be tested with plain literals. */
  id?: string;
  name: string;
  dob: string; // ISO yyyy-mm-dd
  gender: Gender;
  /** Weeks of gestation at birth. Undefined = born at term. */
  gestationalWeeks?: number;
  /** City the family is based in. Optional, parent-entered free text. */
  city?: string;
  createdAt?: string;
  /** Optional profile photo, stored as a data: URL. */
  photoUrl?: string;
}

export type StatusCode = "on_track" | "emerging" | "needs_focus" | "consult";

export interface Status {
  code: StatusCode;
  label: string;
  /** One line explaining what this status means for the parent. */
  meaning: string;
}

export interface DomainScore {
  domain: DomainCode;
  raw: number;
  max: number;
  /** Share of the maximum possible score across the whole window, 0-1. */
  percent: number;
  /** Estimated developmental age for this domain, in months. */
  developmentalMonths: number;
  /** developmentalMonths / assessed age * 100. Null under 4 months old. */
  dq: number | null;
  status: StatusCode;
  achieved: Item[];
  emerging: Item[];
  notYet: Item[];
}

export interface AssessmentResult {
  /** Age used for scoring — corrected age when the child was born preterm. */
  assessedMonths: number;
  chronologicalMonths: number;
  corrected: boolean;
  bands: AgeBand[];
  domainScores: DomainScore[];
  overallDq: number | null;
  overallStatus: StatusCode;
  /**
   * Set when the overall status is worse than the average alone would give,
   * because a single domain needs attention. Without this the report can show
   * a healthy-looking average beside a cautious status and read as a
   * contradiction.
   */
  overallRaisedBy: DomainCode | null;
  strengths: DomainCode[];
  focusAreas: DomainCode[];
  /** True when the child is too young for a meaningful ratio. */
  suppressDq: boolean;
  answeredCount: number;
  totalCount: number;
}

export interface Assessment {
  id: string;
  child: Child;
  assessedOn: string; // ISO yyyy-mm-dd
  responses: Record<string, ResponseValue>;
  completedAt?: string;
  /** Which revision of the item bank produced this assessment. */
  bankVersion: string;
}
