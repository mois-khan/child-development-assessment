import { DOMAIN_BY_CODE } from "@/content/domains";
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
 */

export function headline(result: AssessmentResult, child: Child): string {
  const name = child.name;
  switch (result.overallStatus) {
    case "on_track":
      return `${name} is developing well across all six areas.`;
    case "emerging":
      return `${name} is doing well in most areas, with one or two worth some extra attention.`;
    case "needs_focus":
      return `${name} is growing steadily, and some areas would benefit from focused support.`;
    case "consult":
      return `${name} would benefit from a closer look by a specialist.`;
  }
}

export function summary(result: AssessmentResult, child: Child): string[] {
  const name = child.name;
  const age = formatAge(result.assessedMonths);
  const paras: string[] = [];

  const ageSentence = result.corrected
    ? `${name} is ${formatAge(result.chronologicalMonths)} old. Because ${name} was born early, this report compares them against a corrected age of ${age}, which is the standard way to read development for children born before 37 weeks.`
    : `${name} is ${age} old, and this report compares what they can do now against what we would typically expect at that age.`;
  paras.push(ageSentence);

  if (result.suppressDq) {
    paras.push(
      `At this age, small differences between babies are very normal and week-to-week change is fast, so we have not put a single number on ${name}'s development. What follows is simply what ${name} is already doing and what to look for next.`,
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
    case "on_track":
      paras.push(
        strong
          ? `Across the six areas we looked at, ${name} is doing what we would expect or better, and is particularly strong in ${strong}.`
          : `Across the six areas we looked at, ${name} is doing what we would expect, with an even profile and no area standing out as a concern.`,
      );
      paras.push(
        `There is nothing here that needs acting on. The activities below are simply good next things to play at together.`,
      );
      break;

    case "emerging":
      paras.push(
        strong
          ? `${name} is doing well in most areas, and ${strong} stand out as real strengths.`
          : `${name} is doing well across most of what we looked at.`,
      );
      paras.push(
        `${capitalise(focus)} ${result.focusAreas.length > 1 ? "are" : "is"} a little behind where we would typically expect at this age. This is common and often closes quickly with focused play. We have suggested some things to try below — give them about three months, then run this assessment again to see how it has moved.`,
      );
      break;

    case "needs_focus":
      paras.push(
        strong
          ? `It is worth saying first that ${name} is doing genuinely well in ${strong}.`
          : `${name} has real strengths to build on, and this report is a starting point rather than a verdict.`,
      );
      paras.push(
        `${capitalise(focus)} ${result.focusAreas.length > 1 ? "are" : "is"} meaningfully behind what we would expect at this age. We would suggest working through the activities below every day, and mentioning this report at your next visit to your doctor. Children move quickly at this age when the right things are practised.`,
      );
      break;

    case "consult":
      paras.push(
        strong
          ? `${name} is doing well in ${strong}, and that is a genuine strength to build on.`
          : `Every child has strengths to build on, and this report is a starting point rather than a verdict.`,
      );
      paras.push(
        `Several areas are further behind than we would expect at this age. We would suggest arranging an assessment with a developmental paediatrician or a child therapist, who can look at this properly in person. This is a screening result, not a diagnosis — but it is worth acting on rather than waiting.`,
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

  if (score.dq === null) {
    const n = score.achieved.length;
    return `${name} is showing ${n} of the ${score.max / 2} things we looked for in this area.`;
  }

  const dev = formatAge(Math.round(score.developmentalMonths));

  switch (score.status) {
    case "on_track":
      return `${name}'s ${domain} is at about a ${dev} level, which is at or ahead of where we would expect. ${score.notYet.length > 0 ? "The few things not yet in place are the natural next steps." : "Everything we looked for is in place."}`;
    case "emerging":
      return `${name}'s ${domain} is at about a ${dev} level. That is a little behind where we would typically expect, and the skills listed as not yet are the ones to practise.`;
    case "needs_focus":
      return `${name}'s ${domain} is at about a ${dev} level, which is meaningfully behind what we would expect at this age. This is one of the areas to concentrate on.`;
    case "consult":
      return `${name}'s ${domain} is at about a ${dev} level. This is the area we would most want a professional to look at properly.`;
  }
}

export function nextSteps(result: AssessmentResult, child: Child): string[] {
  const steps: string[] = [];
  const months = result.assessedMonths < 24 ? 3 : 6;
  steps.push(
    `Run this assessment again in ${months} months to see how ${child.name} has moved. Progress between two reports tells you far more than any single report.`,
  );

  if (result.focusAreas.length > 0) {
    steps.push(
      `Pick two or three activities from the focus areas and do them most days. A little and often beats a long session once a week.`,
    );
  }

  if (result.overallStatus === "needs_focus") {
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
