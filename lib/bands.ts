import type { AssessmentResult, StatusCode } from "./types";

/**
 * The five report bands.
 *
 * These are what the CONTENT is written against — every summary, video and
 * course the client supplies in KGKP-Report-Content-Collection.xlsx is keyed
 * by one of these ids. Keep the ids stable: the workbook's "Band code" column
 * is the join key, so renaming one here orphans thirty summaries.
 *
 * They are deliberately NOT the same thing as StatusCode in lib/types.ts.
 * StatusCode is the chart reading — four verdicts read straight off the
 * Developmental Profile's own TIME FRAME column, with no threshold anyone
 * chose. A band is the report's voice: how that reading is presented to a
 * family, and which course it points at. Five bands over four statuses means
 * one status has to split.
 */
export type BandId =
  | "significant_delay"
  | "delay"
  | "mild_gaps"
  | "typical"
  | "advanced";

export interface Band {
  id: BandId;
  /** 1 = furthest behind, 5 = furthest ahead. Matches the workbook's B1–B5. */
  order: number;
  /** Internal label. Parent-facing wording lives in the client's content. */
  label: string;
}

export const BANDS: Band[] = [
  { id: "significant_delay", order: 1, label: "Significant developmental delay" },
  { id: "delay", order: 2, label: "Developmental delay" },
  { id: "mild_gaps", order: 3, label: "Mild developmental gaps" },
  { id: "typical", order: 4, label: "Typically developing" },
  { id: "advanced", order: 5, label: "Advanced development" },
];

export const BAND_BY_ID = Object.fromEntries(
  BANDS.map((b) => [b.id, b]),
) as Record<BandId, Band>;

/**
 * Which of the five bands a finished assessment lands in.
 *
 * The two clean edges are already decided by the chart: `superior` is the
 * chart saying ahead of its own superior column, and `consult` is the chart
 * saying past its slow column — nothing else can mean those things. What is
 * open is the middle, where four statuses have to become five bands.
 *
 * `result.overallStatus` is the chart verdict; `result.overallDq` is the
 * developmental quotient (neurological age / actual age * 100, so 100 is
 * exactly on time) and is null for babies too young for a stable ratio.
 * `result.focusAreas` lists the competences dragging the result down.
 */
export function bandFor(result: AssessmentResult): BandId {
  // TODO(human): map the four chart statuses onto the five report bands.
  //
  // superior -> "advanced" and consult -> "significant_delay" are settled.
  // The decision is how "average" and "slow" divide across the remaining
  // three bands: typical, mild_gaps and delay.
  throw new Error("bandFor is not implemented yet");
}

/** Every status this codebase can produce, for exhaustiveness checks. */
export const ALL_STATUSES: StatusCode[] = [
  "superior",
  "average",
  "slow",
  "consult",
];
