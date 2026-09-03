import { BRAIN_STAGES, FIRST_STAGE, LAST_STAGE } from "@/content/stages";
import type { BrainStage } from "./types";

/**
 * Which stage of the Developmental Profile a child of a given age starts at.
 *
 * The chart gives every stage three ages — superior, average, slow. The one
 * that decides where to begin is the average: a child starts at the stage
 * whose AVERAGE month is nearest their own age. Not the stage whose range
 * contains them, which is a different and wrong answer.
 *
 *   2 months  → nearest average is 2.5 (Pons)       → stage II
 *   8 months  → nearest average is 7 (Mid-Brain)    → stage III, not IV
 *
 * The averages are 1, 2.5, 7, 12, 18, 36 and 72 months, so the boundaries fall
 * at 1.75, 4.75, 9.5, 15, 27 and 54 months. Those are derived here rather than
 * written down, so editing the chart's time frames moves them automatically.
 *
 * Pass the CORRECTED age for a child born preterm — see lib/age.ts. Correcting
 * first and then picking the stage is the whole point of doing them in that
 * order.
 */
export function stageForAge(months: number): BrainStage {
  if (months <= FIRST_STAGE.averageMonths) return FIRST_STAGE;
  if (months >= LAST_STAGE.averageMonths) return LAST_STAGE;

  let best = FIRST_STAGE;
  let bestDistance = Infinity;
  for (const stage of BRAIN_STAGES) {
    const distance = Math.abs(months - stage.averageMonths);
    // Strictly less, so an exact tie between two averages resolves downwards.
    // A child sitting precisely on a boundary is asked the easier stage first,
    // which costs one extra round at worst and never starts them out of depth.
    if (distance < bestDistance) {
      best = stage;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * The age boundaries between stages, for display and for tests. Boundary `i`
 * is where a child stops starting at stage `i` and starts at stage `i + 1`.
 */
export const STAGE_BOUNDARIES: number[] = BRAIN_STAGES.slice(0, -1).map(
  (stage, i) => (stage.averageMonths + BRAIN_STAGES[i + 1].averageMonths) / 2,
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
