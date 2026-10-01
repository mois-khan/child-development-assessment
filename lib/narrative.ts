import { DOMAIN_BY_CODE } from "@/content/domains";
import type { AssessmentResult, Child, DomainScore } from "./types";
import { formatAge } from "./age";
import { getCmsText } from "./cms";

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Builds the standard set of variables available to any CMS text block */
export function getNarrativeVars(result: AssessmentResult | null, child: Child): Record<string, string> {
  const isBoy = child.gender === 'boy';
  const isGirl = child.gender === 'girl';
  
  const he_she = isBoy ? 'he' : isGirl ? 'she' : 'they';
  const him_her = isBoy ? 'him' : isGirl ? 'her' : 'them';
  const his_her = isBoy ? 'his' : isGirl ? 'her' : 'their';

  let vars: Record<string, string> = {
    name: child.name,
    he_she, him_her, his_her,
    He_She: capitalise(he_she),
    Him_Her: capitalise(him_her),
    His_Her: capitalise(his_her),
  };

  if (result) {
    const strong = result.strengths.map((c) => DOMAIN_BY_CODE[c].name.toLowerCase()).join(" and ");
    const focus = result.focusAreas.map((c) => DOMAIN_BY_CODE[c].name.toLowerCase()).join(" and ");
    const is_are = result.focusAreas.length > 1 ? "are" : "is";
    const gap_months = result.assessedMonths < 24 ? "3" : "6";

    vars = {
      ...vars,
      age: formatAge(result.assessedMonths),
      chronological_age: formatAge(result.chronologicalMonths),
      strongest_domain: strong || "all areas",
      weakest_domains: focus || "none",
      is_are,
      gap_months,
      grade: result.overallStatus
    };
  }

  return vars;
}

export function headline(result: AssessmentResult, child: Child): string {
  const vars = getNarrativeVars(result, child);
  switch (result.overallStatus) {
    case "A++":
    case "A+":
      return getCmsText("report_headline_a_plus", `${vars.name} is ahead of the chart across the board.`, vars);
    case "A":
      return getCmsText("report_headline_a", `${vars.name} is developing well across all six areas.`, vars);
    case "A-":
      return getCmsText("report_headline_a_minus", `${vars.name} is growing steadily, and some areas would benefit from focused support.`, vars);
    case "A--":
      return getCmsText("report_headline_a_minus_minus", `${vars.name} requires immediate and intensive support.`, vars);
  }
}

export function summary(result: AssessmentResult, child: Child): string[] {
  const vars = getNarrativeVars(result, child);
  const paras: string[] = [];

  if (result.corrected) {
    paras.push(
      getCmsText("report_summary_preemie", `${vars.name} is ${vars.chronological_age} old. Because ${vars.he_she} was born early, this report compares ${vars.him_her} against a corrected age of ${vars.age}, which is the standard way to read development for children born before 37 weeks.`, vars)
    );
  } else {
    paras.push(
      getCmsText("report_summary_intro", `${vars.name} is ${vars.age} old. This report places ${vars.him_her} on the Developmental Profile (seven stages of brain development, checked across six areas) and compares where ${vars.he_she} is against the age the chart expects each stage to be reached.`, vars)
    );
  }

  if (result.suppressDq) {
    paras.push(
      getCmsText("report_summary_suppress_dq", `At this age, small differences between babies are very normal and week-to-week change is fast, so we have not put a single number on ${vars.name}'s development. What follows is simply the stage ${vars.name} has already reached in each area, and what comes next.`, vars)
    );
    return paras;
  }

  const hasStrong = result.strengths.length > 0;

  switch (result.overallStatus) {
    case "A++":
    case "A+":
      paras.push(
        hasStrong
          ? getCmsText("report_summary_a_plus_strong", `${vars.name} has reached every stage we looked at earlier than the chart expects, and is furthest ahead in ${vars.strongest_domain}.`, vars)
          : getCmsText("report_summary_a_plus_even", `${vars.name} has reached every stage we looked at earlier than the chart expects, with an even profile across all six areas.`, vars)
      );
      paras.push(
        getCmsText("report_summary_a_plus_closing", `There is nothing here that needs acting on. The activities below are pitched at the stage above, so they stay worth doing.`, vars)
      );
      break;

    case "A":
      paras.push(
        hasStrong
          ? getCmsText("report_summary_a_strong", `Across the six areas, ${vars.name} is reaching each stage at or before the age the chart expects, and is particularly strong in ${vars.strongest_domain}.`, vars)
          : getCmsText("report_summary_a_even", `Across the six areas, ${vars.name} is reaching each stage at the age the chart expects, with an even profile and no area standing out as a concern.`, vars)
      );
      paras.push(
        getCmsText("report_summary_a_closing", `There is nothing here that needs acting on. The activities below are simply good next things to play at together.`, vars)
      );
      break;

    case "A-":
      paras.push(
        hasStrong
          ? getCmsText("report_summary_a_minus_strong", `It is worth saying first that ${vars.name} is doing genuinely well in ${vars.strongest_domain}.`, vars)
          : getCmsText("report_summary_a_minus_even", `${vars.name} has real strengths to build on, and this report is a starting point rather than a verdict.`, vars)
      );
      paras.push(
        getCmsText("report_summary_a_minus_action", `${capitalise(vars.weakest_domains)} ${vars.is_are} behind the age the chart expects for the stage ${vars.name} has reached. That is worth working on rather than waiting on. We would suggest the activities below every day.`, vars)
      );
      break;

    case "A--":
      paras.push(
        hasStrong
          ? getCmsText("report_summary_a_minus_minus_strong", `${vars.name} is doing well in ${vars.strongest_domain}, and that is a genuine strength to build on.`, vars)
          : getCmsText("report_summary_a_minus_minus_even", `Every child has strengths to build on, and this report is a starting point rather than a verdict.`, vars)
      );
      paras.push(
        getCmsText("report_summary_a_minus_minus_action", `Several areas are further behind than the chart's own range allows for. We would suggest arranging an assessment with a developmental paediatrician or a child therapist, who can look at this properly in person. This is a screening result, not a diagnosis, but it is worth acting on rather than waiting.`, vars)
      );
      paras.push(
        getCmsText("report_summary_a_minus_minus_closing", `In the meantime, the activities below are still worth doing, and early support makes a real difference at this age.`, vars)
      );
      break;
  }

  return paras;
}

export function domainNote(score: DomainScore, child: Child): string {
  const vars = { 
    ...getNarrativeVars(null, child), 
    domain: DOMAIN_BY_CODE[score.domain].name.toLowerCase() 
  };

  switch (score.status) {
    case "A++":
      return getCmsText(`domain_note_${score.domain}_a_plus_plus`, `${vars.name} demonstrates a much-beyond-age progress in the ${vars.domain} competence.`, vars);
    case "A+":
      return getCmsText(`domain_note_${score.domain}_a_plus`, `${vars.name} demonstrates beyond-age progress in the ${vars.domain} competence.`, vars);
    case "A":
      return getCmsText(`domain_note_${score.domain}_a`, `${vars.name} demonstrates age appropriate progress in the ${vars.domain} competence.`, vars);
    case "A-":
      return getCmsText(`domain_note_${score.domain}_a_minus`, `${vars.name} falls under a mild developmental gap category in the ${vars.domain} competence.`, vars);
    case "A--":
      return getCmsText(`domain_note_${score.domain}_a_minus_minus`, `${vars.name} requires immediate and intensive support in ${vars.domain} competence.`, vars);
  }
  return "";
}

export function nextSteps(result: AssessmentResult, child: Child): string[] {
  const vars = getNarrativeVars(result, child);
  const steps: string[] = [];
  
  steps.push(
    getCmsText("report_action_plan_intro", `Run this assessment again in ${vars.gap_months} months to see how ${vars.name} has moved. Progress between two reports tells you far more than any single report.`, vars)
  );

  if (result.focusAreas.length > 0) {
    steps.push(
      getCmsText("report_action_plan_focus", `Pick two or three activities from the focus areas and do them most days. A little and often beats a long session once a week.`, vars)
    );
  }

  if (result.overallStatus === "A-") {
    steps.push(
      getCmsText("report_action_plan_a_minus", `Take this report to your next appointment with your doctor and ask about a developmental screening.`, vars)
    );
  }

  if (result.overallStatus === "A--") {
    steps.push(
      getCmsText("report_action_plan_a_minus_minus", `Ask your doctor to refer you to a developmental paediatrician, or contact a child development centre directly. You do not need to wait for a referral to ask.`, vars)
    );
  }

  steps.push(
    getCmsText("report_action_plan_warning", `Talk to your doctor sooner if ${vars.name} loses a skill ${vars.he_she} used to have, stops responding to sound, or stops making eye contact. Those are worth checking straight away, whatever this report says.`, vars)
  );

  return steps;
}

export function getDisclaimer(): string {
  return getCmsText("report_disclaimer", "This is a developmental screening tool, not a diagnosis. It is based on parent report and is designed to show where a child may benefit from extra support or a closer look by a professional. It cannot diagnose any condition. If you have concerns about your child's development, speak to your doctor, whatever this report says.");
}

export function overallSummary(result: AssessmentResult, child: Child): string {
  const vars = getNarrativeVars(result, child);
  const gradeText = result.overallStatus === "A++" || result.overallStatus === "A+" 
    ? "beyond expectation" 
    : result.overallStatus === "A" 
      ? "as expected" 
      : "below expectation";

  vars.grade = gradeText;
  
  return getCmsText("report_overall_summary", `The KECCTRA report indicates that ${vars.name} is developing ${vars.grade} for ${vars.his_her} age.`, vars);
}
