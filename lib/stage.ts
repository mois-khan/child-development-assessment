import { BRAIN_STAGES, FIRST_STAGE, LAST_STAGE } from "@/content/stages";
import type { BrainStage } from "./types";

/**
 * Starting month for each stage's developmental bracket:
 *   Phase I:    0 <= age < 1 months     (Start: 0)
 *   Phase II:   1 <= age < 2.5 months   (Start: 1)
 *   Phase III:  2.5 <= age < 7 months   (Start: 2.5)
 *   Phase IV:   7 <= age < 12 months    (Start: 7)
 *   Phase V:    12 <= age < 18 months   (Start: 12)
 *   Phase VI-A: 18 <= age < 27 months   (Start: 18)
 *   Phase VI-B: 27 <= age < 36 months   (Start: 27)
 *   Phase VII-A:36 <= age < 54 months   (Start: 36)
 *   Phase VII-B:54 <= age <= 72 months  (Start: 54)
 */
export function stageStartMonths(stage: BrainStage): number {
  if (stage.order === 1) return 0;
  const prevStage = BRAIN_STAGES[stage.order - 2];
  return prevStage ? prevStage.averageMonths : stage.superiorMonths;
}

/**
 * The age interval represented by one box in the developmental chart.
 *
 * A box begins when the preceding average milestone ends and finishes at its
 * own average milestone. This makes Phase I 0–1 month (30 days) and Phase II
 * 1–2.5 months (45 days), matching the range parents see in the report.
 */
export function stageAgeWindow(stage: BrainStage): {
  startMonths: number;
  endMonths: number;
} {
  return {
    startMonths: stageStartMonths(stage),
    endMonths: stage.averageMonths,
  };
}

/**
 * Exact progress through the chart box that contains an age. The progress is
 * 0 at the bottom of the box and 1 at its top. A calendar month is treated as
 * 30 days here because this is the report's displayed clinical scale.
 */
export function stageProgressForAge(months: number): {
  stage: BrainStage;
  progress: number;
} {
  const stage = stageForAge(months);
  const { startMonths, endMonths } = stageAgeWindow(stage);
  const span = Math.max(endMonths - startMonths, 1 / 30);
  return {
    stage,
    progress: Math.max(0, Math.min(1, (months - startMonths) / span)),
  };
}

/**
 * Which stage of the Developmental Profile a child of a given age starts at.
 *
 * Evaluates against the clinical start month of each phase bracket from
 * highest to lowest. A child belongs to the phase whose starting month they
 * have reached or exceeded.
 *
 *   2 months   -> in [1, 2.5)   -> Phase II
 *   3 months   -> in [2.5, 7)   -> Phase III
 *   8 months   -> in [7, 12)    -> Phase IV
 *   13 months  -> in [12, 18)   -> Phase V
 *   28 months  -> in [27, 36)   -> Phase VI-B
 *
 * Pass the CORRECTED age for a child born preterm — see lib/age.ts. Correcting
 * first and then picking the stage is the whole point of doing them in that
 * order.
 */
export function stageForAge(months: number): BrainStage {
  for (let i = BRAIN_STAGES.length - 1; i >= 0; i--) {
    const stage = BRAIN_STAGES[i];
    if (months >= stageStartMonths(stage)) {
      return stage;
    }
  }
  return FIRST_STAGE;
}

/**
 * The age boundaries between stages, for display and for tests. Boundary `i`
 * is where a child stops starting at stage `i` and starts at stage `i + 1`.
 */
export const STAGE_BOUNDARIES: number[] = BRAIN_STAGES.slice(1).map(
  (stage) => stageStartMonths(stage),
);

/**
 * How a child's age compares to the time frame of the stage they reached.
 *
 * This is the chart reading itself — no thresholds are chosen here. Reach
 * stage IV by 6 months and the chart's superior column says superior; by 12,
 * its average column says average; by 24, its slow column says slow. Past the
 * slow column the chart has nothing left to say, which is exactly the point at
 * which a professional should look.
 */
export function classifyAgainstStage(
  stage: BrainStage,
  assessedMonths: number,
): "superior" | "average" | "slow" | "consult" {
  if (assessedMonths <= stage.superiorMonths) return "superior";
  if (assessedMonths <= stage.averageMonths) return "average";
  if (assessedMonths <= stage.slowMonths) return "slow";
  return "consult";
}
