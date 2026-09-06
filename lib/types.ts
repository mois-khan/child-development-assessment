/**
 * Core domain types for the Kaushalya milestone screener.
 *
 * The model follows the programme's own Developmental Profile chart (see
 * content/stages.ts): seven brain stages by six competences. A child is placed
 * at one stage per competence, and the chart's own time frames say what that
 * placement means.
 *
 * Everything in `content/` is data, not code: the stage table, the item bank
 * and the activities are all plain objects so they can be moved into Supabase
 * tables (see supabase/migrations) and edited by the child development team
 * without a deploy.
 */

/**
 * The six competences the chart tracks. `hand` is the chart's "Manual
 * Competence" and `vision` its "Visual Competence"; the shorter codes are kept
 * because they are already the storage keys.
 */
export type DomainCode =
  | "vision"
  | "auditory"
  | "tactile"
  | "mobility"
  | "language"
  | "hand";

/** Chart-facing alias. The chart calls these competences, the storage calls them domains. */
export type CompetenceCode = DomainCode;

export interface Domain {
  code: DomainCode;
  /** The chart's own column heading, e.g. "Visual Competence". */
  name: string;
  /** One word, for chart axes and other places the full name will not fit. */
  short: string;
  /** One sentence a parent can understand, shown under the name. */
  blurb: string;
  /** What the competence covers, in professional terms. For the handoff/PDF. */
  scope: string;
  /** Hue used for this competence's chart series and card accent. */
  hue: number;
  order: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Brain stages
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * One of the seven rows of the Developmental Profile.
 *
 * The three month figures are the chart's TIME FRAME column, and they are the
 * only thresholds this engine has — nothing else is invented. A child who
 * reaches this stage at or before `superiorMonths` is superior, by
 * `averageMonths` is average, by `slowMonths` is slow, and after that the
 * profile is worth a professional look.
 */
export interface BrainStage {
  id: string;
  order: number;
  /** "I" through "VII", as the chart numbers them. */
  roman: string;
  /** "Pons", "Mid-Brain", "Initial Cortex"… */
  name: string;
  superiorMonths: number;
  averageMonths: number;
  slowMonths: number;
  /** Row colour on the printed chart, so the report can match it. */
  hue: number;
}

/** One of the forty-two boxes on the chart. */
export interface StageCell {
  /** 1–42, as printed in the corner of each box. */
  number: number;
  stage: string;
  competence: CompetenceCode;
  /** The main line, e.g. "Outline perception". */
  description: string;
  /** The italic line beneath, e.g. "Vital perception". */
  kind: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Items
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * What kind of answer an item takes.
 *
 * Only `yesno` items score. The rest are recorded because the paper booklet
 * records them and a clinician reading the report wants them — which hand the
 * child writes with, how many words they say — but they are observations, not
 * evidence for or against a stage.
 */
export type ItemKind = "yesno" | "choice" | "count" | "percent" | "text";

export type ItemSource = "ACE" | "AUTHORED";

export interface Item {
  id: string;
  domain: DomainCode;
  /** Which of the seven stages this item tests. */
  stage: string;
  /** The question as the parent reads it. */
  text: string;
  /** Concrete instruction so the parent tests rather than recalls. */
  how: string;
  kind: ItemKind;
  source: ItemSource;
  /**
   * True when "yes" is the concerning answer rather than the expected one —
   * the booklet's "Are his arms and/or legs too tight or too floppy?". Scoring
   * flips these, so the parent still answers naturally.
   */
  invert?: boolean;
  /**
   * Only ask this item once the child is at least this old. The booklet's
   * "if over six…" questions, which are meaningless before then.
   */
  minAgeMonths?: number;
  /** For `choice` items: the two labels, e.g. ["Left", "Right"]. */
  choices?: [string, string];
  /** For `count` and `percent` items: the unit shown beside the input. */
  unit?: string;
}

/**
 * No = 0, Yes = 1. The booklet is strictly yes/no and so is this — a stage is
 * something a child either has or has not reached.
 *
 * Unanswered items leave the denominator rather than scoring as no.
 */
export type ResponseValue = 0 | 1;

/* ────────────────────────────────────────────────────────────────────────────
 * Activities
 * ──────────────────────────────────────────────────────────────────────────*/

export interface Activity {
  id: string;
  domain: DomainCode;
  /** Activities are written per stage — one set per row of the chart. */
  stage: string;
  title: string;
  description: string;
  materials: string;
  minutes: number;
  frequency: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Children
 * ──────────────────────────────────────────────────────────────────────────*/

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
  /**
   * Parent's phone number, optional and parent-entered. The one field the
   * sales follow-up system (lib/admin/leads.ts) actually needs to be useful —
   * a lead with no way to reach the family isn't one.
   */
  phone?: string;
  createdAt?: string;
  /** Optional profile photo, stored as a data: URL. */
  photoUrl?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Results
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * The chart's own four verdicts, in its own words, plus the one it implies
 * past the slow column.
 *
 * These are not thresholds anyone chose — they are read straight off the
 * TIME FRAME column of whichever stage the child reached.
 */
export type StatusCode = "superior" | "average" | "slow" | "consult";

export interface Status {
  code: StatusCode;
  label: string;
  /** One line explaining what this status means for the parent. */
  meaning: string;
}

export interface DomainScore {
  domain: DomainCode;
  /** The highest stage the child passed, with everything below it also passed. */
  achievedStage: string;
  /** The chart cell that stage lands in — what the report names. */
  cell: StageCell;
  /** Stages actually asked about, in chart order. */
  stagesAsked: string[];
  /** Yes answers, out of the yes/no items answered. */
  raw: number;
  max: number;
  percent: number;
  /**
   * Neurological age in months: the achieved stage's average month, plus
   * partial credit into the stage above.
   */
  neurologicalMonths: number;
  /** neurologicalMonths / assessed age * 100. Null when too young to be stable. */
  dq: number | null;
  status: StatusCode;
  /** Items answered yes at the achieved stage and below. */
  achieved: Item[];
  /** Items answered no — the concrete next things to work on. */
  notYet: Item[];
  /** Non-scoring observations the parent recorded, keyed by item id. */
  details: Record<string, string>;
}

export interface AssessmentResult {
  /** Age used for scoring — corrected age when the child was born preterm. */
  assessedMonths: number;
  chronologicalMonths: number;
  corrected: boolean;
  /** The stage the assessment started at, from the child's age alone. */
  startStage: string;
  /** Every stage asked about, across all six competences. */
  stages: BrainStage[];
  domainScores: DomainScore[];
  overallDq: number | null;
  overallStatus: StatusCode;
  /**
   * Set when the overall status is worse than the average alone would give,
   * because a single competence needs attention. Without this the report can
   * show a healthy-looking average beside a cautious status and read as a
   * contradiction.
   */
  overallRaisedBy: DomainCode | null;
  strengths: DomainCode[];
  focusAreas: DomainCode[];
  /** True when the child is too young for a meaningful ratio. */
  suppressDq: boolean;
  answeredCount: number;
}

export interface Assessment {
  id: string;
  child: Child;
  assessedOn: string; // ISO yyyy-mm-dd
  /** Yes/no answers, keyed by item id. */
  responses: Record<string, ResponseValue>;
  /** Non-scoring answers (counts, percentages, which hand, examples). */
  details: Record<string, string>;
  completedAt?: string;
  /** Which revision of the item bank produced this assessment. */
  bankVersion: string;
}
