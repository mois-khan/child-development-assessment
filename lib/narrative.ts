import { DOMAIN_BY_CODE } from "@/content/domains";
import { STAGE_BY_ID } from "@/content/stages";
import type { AssessmentResult, Child, DomainScore } from "./types";
import { formatAge } from "./age";

/**
 * Report wording.
 *
 * Deliberately template-driven rather than generated at request time. The
 * report tells some parents something frightening about their child, and every
 * sentence a family can receive should be reviewable in advance by Kaushalya's
 * team. Nothing here is written by a model at runtime.
 *
 * Rules this file follows:
 *   - never "delay", "fail", "deficit", "abnormal", "behind" as a verdict
 *   - always name a genuine strength before naming a concern
 *   - always end with something concrete the parent can do
 *   - the child's name, and "they", rather than clinical third person
 *   - the chart's own language — stages, and the age each one is reached
 */

export function headline(result: AssessmentResult, child: Child): string {
  const name = child.name;
  switch (result.overallStatus) {
    case "superior":
      return `${name} is ahead of the chart across the board.`;
    case "average":
      return `${name} is developing well across all six areas.`;
    case "slow":
      return `${name} is growing steadily, and some areas would benefit from focused support.`;
    case "consult":
      return `${name} would benefit from a closer look by a specialist.`;
  }
}

export function summary(result: AssessmentResult, child: Child): string[] {
  const name = child.name;
  const age = formatAge(result.assessedMonths);
  const paras: string[] = [];

  paras.push(
    result.corrected
      ? `${name} is ${formatAge(result.chronologicalMonths)} old. Because ${name} was born early, this report compares them against a corrected age of ${age}, which is the standard way to read development for children born before 37 weeks.`
      : `${name} is ${age} old. This report places them on the Developmental Profile — seven stages of brain development, checked across six areas — and compares where they are against the age the chart expects each stage to be reached.`,
  );

  if (result.suppressDq) {
    paras.push(
      `At this age, small differences between babies are very normal and week-to-week change is fast, so we have not put a single number on ${name}'s development. What follows is simply the stage ${name} has already reached in each area, and what comes next.`,
    );
    return paras;
  }

  const strong = result.strengths
    .map((c) => DOMAIN_BY_CODE[c].name.toLowerCase())
    .join(" and ");
  const focus = result.focusAreas
    .map((c) => DOMAIN_BY_CODE[c].name.toLowerCase())
    .join(" and ");

  switch (result.overallStatus) {
    case "superior":
      paras.push(
        strong
          ? `${name} has reached every stage we looked at earlier than the chart expects, and is furthest ahead in ${strong}.`
          : `${name} has reached every stage we looked at earlier than the chart expects, with an even profile across all six areas.`,
      );
      paras.push(
        `There is nothing here that needs acting on. The activities below are pitched at the stage above, so they stay worth doing.`,
      );
      break;

    case "average":
      paras.push(
        strong
          ? `Across the six areas, ${name} is reaching each stage at or before the age the chart expects, and is particularly strong in ${strong}.`
          : `Across the six areas, ${name} is reaching each stage at the age the chart expects, with an even profile and no area standing out as a concern.`,
      );
      paras.push(
        `There is nothing here that needs acting on. The activities below are simply good next things to play at together.`,
      );
      break;

    case "slow":
      paras.push(
        strong
          ? `It is worth saying first that ${name} is doing genuinely well in ${strong}.`
          : `${name} has real strengths to build on, and this report is a starting point rather than a verdict.`,
      );
      paras.push(
        `${capitalise(focus)} ${result.focusAreas.length > 1 ? "are" : "is"} behind the age the chart expects for the stage ${name} has reached. That is worth working on rather than waiting on. We would suggest the activities below every day, and mentioning this report at your next visit to your doctor.`,
      );
      break;

    case "consult":
      paras.push(
        strong
          ? `${name} is doing well in ${strong}, and that is a genuine strength to build on.`
          : `Every child has strengths to build on, and this report is a starting point rather than a verdict.`,
      );
      paras.push(
        `Several areas are further behind than the chart's own range allows for. We would suggest arranging an assessment with a developmental paediatrician or a child therapist, who can look at this properly in person. This is a screening result, not a diagnosis — but it is worth acting on rather than waiting.`,
      );
      paras.push(
        `In the meantime, the activities below are still worth doing, and early support makes a real difference at this age.`,
      );
      break;
  }

  return paras;
}

export function domainNote(score: DomainScore, child: Child): string {
  const name = child.name;
  const domain = DOMAIN_BY_CODE[score.domain].name.toLowerCase();
  const stage = STAGE_BY_ID[score.achievedStage];

  if (!stage) {
    return `${name} has not yet reached the first stage of the chart in ${domain}. This is the area we would most want a professional to look at properly.`;
  }

  const reached = `${name} has reached stage ${stage.roman}, ${stage.name}, in ${domain} — “${score.cell.description.toLowerCase()}”`;
  const expected = `The chart expects this stage at about ${months(stage.averageMonths)}`;

  switch (score.status) {
    case "superior":
      return `${reached}. ${expected}, and ${name} is there well ahead of that. ${score.notYet.length > 0 ? "The things listed as not yet are from the stage above, and are the natural next steps." : "This is a real strength."}`;
    case "average":
      return `${reached}. ${expected}, which is where ${name} is. ${score.notYet.length > 0 ? "The things listed as not yet are the natural next steps." : "Everything we looked for is in place."}`;
    case "slow":
      return `${reached}. ${expected}, so this is an area to concentrate on. The things listed as not yet are exactly what to practise.`;
    case "consult":
      return `${reached}. ${expected}, and ${name} has taken longer than the chart's range allows. This is the area we would most want a professional to look at properly.`;
  }
}

export function nextSteps(result: AssessmentResult, child: Child): string[] {
  const steps: string[] = [];
  const gap = result.assessedMonths < 24 ? 3 : 6;
  steps.push(
    `Run this assessment again in ${gap} months to see how ${child.name} has moved. Progress between two reports tells you far more than any single report.`,
  );

  if (result.focusAreas.length > 0) {
    steps.push(
      `Pick two or three activities from the focus areas and do them most days. A little and often beats a long session once a week.`,
    );
  }

  if (result.overallStatus === "slow") {
    steps.push(
      `Take this report to your next appointment with your doctor and ask about a developmental screening.`,
    );
  }

  if (result.overallStatus === "consult") {
    steps.push(
      `Ask your doctor to refer you to a developmental paediatrician, or contact a child development centre directly. You do not need to wait for a referral to ask.`,
    );
  }

  steps.push(
    `Talk to your doctor sooner if ${child.name} loses a skill they used to have, stops responding to sound, or stops making eye contact. Those are worth checking straight away, whatever this report says.`,
  );

  return steps;
}

export const DISCLAIMER =
  "This is a developmental screening tool, not a diagnosis. It is based on parent report and is designed to show where a child may benefit from extra support or a closer look by a professional. It cannot diagnose any condition. If you have concerns about your child's development, speak to your doctor — whatever this report says.";

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "2.5 months" / "3 years" — the chart's time frames read out loud. */
function months(n: number): string {
  if (n >= 24 && Number.isInteger(n / 12)) {
    const y = n / 12;
    return `${y} year${y === 1 ? "" : "s"}`;
  }
  return `${n} month${n === 1 ? "" : "s"}`;
}
