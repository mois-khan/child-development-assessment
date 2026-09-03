import {
  BRAIN_STAGES,
  STAGE_BY_ID,
  cellFor,
  stageAbove,
  stageBelow,
} from "@/content/stages";
import { DOMAINS } from "@/content/domains";
import { itemsFor, scoredItemsFor } from "@/content/items";
import type {
  AssessmentResult,
  BrainStage,
  Child,
  DomainCode,
  DomainScore,
  Item,
  ResponseValue,
  Status,
  StatusCode,
} from "./types";
import { summariseAge } from "./age";
import { classifyAgainstStage, stageForAge } from "./stage";

/* ────────────────────────────────────────────────────────────────────────────
 * How this engine works, in one place.
 *
 * The Developmental Profile chart (content/stages.ts) is the whole instrument.
 * For each of the six competences, the engine finds the highest of the seven
 * brain stages the child has actually reached, and then lets the chart say
 * what that means.
 *
 *   1. The child's corrected age picks a STARTING stage — the one whose
 *      average month is nearest their age. Nothing else is asked first.
 *
 *   2. For each competence independently, we ask that stage's questions.
 *      Pass, and we climb: ask the stage above, and keep climbing until they
 *      stop passing or we run out of chart. Fail, and we descend: ask the
 *      stage below, and keep descending until they pass one or we reach the
 *      bottom. The walk never changes direction, so it always terminates.
 *
 *   3. The highest stage passed — with every stage asked below it also passed
 *      — is the stage the child has reached. Partial credit from the stage
 *      above interpolates between the two, so a child halfway up does not have
 *      to round down a whole stage.
 *
 *   4. The chart classifies it. Reach stage IV by 6 months and the chart's
 *      superior column says superior; by 12 its average column says average;
 *      by 24 its slow column says slow. Past that the chart has nothing more
 *      to say, which is exactly where a professional should look.
 *
 * Worth knowing: the chart's slow column is always twice its average, and its
 * superior column is half (0.4× at stage II). So these four verdicts are the
 * same scale as the developmental quotient — 200, 100 and 50 — and the DQ and
 * the status can never disagree. That is a property of the chart, not a
 * coincidence, and it is why no threshold in this file was chosen by us.
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * Share of a stage's scored questions a child must answer "yes" to have
 * reached it.
 *
 * CLINICAL CONSTANT — Kaushalya's child development lead should confirm this
 * before any real family sees a result.
 *
 * A consequence worth knowing: most cells of the chart carry only two or three
 * questions, and at 0.75 that means every one of them has to be "yes". Only
 * the cells with four or more questions can absorb a single "no". That is very
 * close to how the paper booklet is read in the room, which is why it is the
 * default.
 */
export const PASS_THRESHOLD = 0.75;

/**
 * Below this age the ratio of neurological to actual age divides by something
 * too small to be stable, so no quotient is reported. The chart itself still
 * works — stage I begins at birth — so the profile is shown, just without a
 * number attached to it.
 */
export const MIN_AGE_FOR_DQ = 1;

export const STATUSES: Record<StatusCode, Status> = {
  superior: {
    code: "superior",
    label: "Superior",
    meaning: "Ahead of the chart's average for this age — this is a real strength.",
  },
  average: {
    code: "average",
    /* The chart's own word for this column is "Average", but a child who
       reached the stage a good deal earlier than average also lands here —
       the next column up asks for twice the pace, not a little more. Calling
       the band "Average" would then sit oddly beside a quotient of 150, so the
       label says what the band actually means and the number says how far
       ahead. */
    label: "On track",
    meaning:
      "Reached this stage at the age the chart expects, or earlier. Nothing to act on.",
  },
  slow: {
    code: "slow",
    /* The chart's own word for this column is "Slow". That is the right word
       on a clinician's wall chart and the wrong one on a report a parent reads
       alone, at home, about their own child — so the code keeps the chart's
       term and the label does not. See the wording rules at the top of
       lib/narrative.ts. */
    label: "Needs focus",
    meaning:
      "Behind the age the chart expects for this stage, but within its range — the chart calls this band “slow”. Worth daily focused activity, and worth mentioning at the next visit to your doctor.",
  },
  consult: {
    code: "consult",
    label: "Worth a closer look",
    meaning:
      "We suggest an assessment by a developmental paediatrician or therapist. This is a screening result, not a diagnosis.",
  },
};

const STATUS_SEVERITY: Record<StatusCode, number> = {
  superior: 0,
  average: 1,
  slow: 2,
  consult: 3,
};

const SEVERITY_STATUS: StatusCode[] = ["superior", "average", "slow", "consult"];

/* ────────────────────────────────────────────────────────────────────────────
 * Reading one cell of the chart
 * ──────────────────────────────────────────────────────────────────────────*/

export interface CellResult {
  /** Share of scored questions answered as expected, 0–1. */
  value: number;
  answered: number;
  total: number;
  passed: boolean;
}

/**
 * How the child did on one stage of one competence.
 *
 * Inverted questions — the booklet's "are his arms and/or legs too tight or
 * too floppy?" — count backwards, so the parent can answer naturally and "no"
 * is what scores. Unanswered questions leave the denominator rather than
 * counting as "no".
 */
export function readCell(
  stage: string,
  domain: DomainCode,
  responses: Record<string, ResponseValue>,
  assessedMonths?: number,
): CellResult {
  const items = scoredItemsFor(stage, domain, assessedMonths);
  let raw = 0;
  let answered = 0;
  for (const item of items) {
    const v = responses[item.id];
    if (v === undefined) continue;
    raw += item.invert ? 1 - v : v;
    answered += 1;
  }
  const value = answered === 0 ? 0 : raw / answered;
  return {
    value,
    answered,
    total: items.length,
    passed: answered > 0 && value >= PASS_THRESHOLD,
  };
}

/** True once every scored question in a cell has an answer. */
export function cellComplete(
  stage: string,
  domain: DomainCode,
  responses: Record<string, ResponseValue>,
  assessedMonths?: number,
): boolean {
  const items = scoredItemsFor(stage, domain, assessedMonths);
  return items.length > 0 && items.every((i) => responses[i.id] !== undefined);
}

/* ────────────────────────────────────────────────────────────────────────────
 * The ladder walk
 * ──────────────────────────────────────────────────────────────────────────*/

/** The stage a child of this age is asked about first, before anything else. */
export function startStageFor(assessedMonths: number): BrainStage {
  return stageForAge(assessedMonths);
}

function sortStages(ids: string[]): BrainStage[] {
  return ids
    .map((id) => STAGE_BY_ID[id])
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

/**
 * The next stage to ask one competence about, or null when it has settled.
 *
 * The rule has no memory of which way it has been travelling, because it does
 * not need one: climb while the top of the range asked keeps passing, descend
 * while the bottom of it keeps failing, and stop when neither is true. A walk
 * that started upwards can never satisfy the descend condition (its bottom
 * stage passed), and one that started downwards can never satisfy the climb
 * condition (its top stage failed), so it cannot oscillate.
 */
export function nextStageFor(
  domain: DomainCode,
  stagesAsked: string[],
  responses: Record<string, ResponseValue>,
  assessedMonths: number,
): BrainStage | null {
  const asked = sortStages(stagesAsked);
  if (asked.length === 0) return startStageFor(assessedMonths);

  const lowest = asked[0];
  const highest = asked[asked.length - 1];

  // Never move on from a stage that is still half answered.
  if (!cellComplete(highest.id, domain, responses, assessedMonths)) return null;
  if (!cellComplete(lowest.id, domain, responses, assessedMonths)) return null;

  if (readCell(highest.id, domain, responses, assessedMonths).passed) {
    return stageAbove(highest); // null at the top of the chart — settled there
  }
  if (!readCell(lowest.id, domain, responses, assessedMonths).passed) {
    return stageBelow(lowest); // null at the bottom of the chart — settled there
  }
  return null;
}

/**
 * The stage this competence has settled at: the highest one passed, with every
 * stage asked below it also passed.
 *
 * Null means the child did not pass the lowest stage we asked about. After a
 * full walk that can only happen at stage I, since the descent does not stop
 * until it finds a pass or runs out of chart.
 */
export function achievedStageFor(
  domain: DomainCode,
  stagesAsked: string[],
  responses: Record<string, ResponseValue>,
  assessedMonths: number,
): { stage: BrainStage | null; nextAsked: BrainStage | null } {
  const asked = sortStages(stagesAsked).filter(
    (s) => readCell(s.id, domain, responses, assessedMonths).answered > 0,
  );
  if (asked.length === 0) return { stage: null, nextAsked: null };

  let baseIdx = -1;
  for (let i = 0; i < asked.length; i++) {
    if (readCell(asked[i].id, domain, responses, assessedMonths).passed) baseIdx = i;
    else break; // the first stage not passed is the ceiling of what they have
  }

  return {
    stage: baseIdx === -1 ? null : asked[baseIdx],
    nextAsked: asked[baseIdx + 1] ?? null,
  };
}

/**
 * Neurological age in months for one competence.
 *
 * The stage reached sets the base — its average month, straight off the chart.
 * Partial credit on the stage above interpolates within it, so a child who has
 * fully reached stage IV (12 months) and answers half of stage V lands at
 * 12 + 0.5 × (18 − 12) = 15 months rather than rounding down to 12.
 */
export function neurologicalAge(
  domain: DomainCode,
  stagesAsked: string[],
  responses: Record<string, ResponseValue>,
  assessedMonths: number,
): number {
  const { stage, nextAsked } = achievedStageFor(
    domain,
    stagesAsked,
    responses,
    assessedMonths,
  );

  // Did not pass even the lowest stage asked. Interpolate across the range
  // below it, which is everything we have no evidence about.
  if (!stage) {
    const lowest = sortStages(stagesAsked)[0];
    if (!lowest) return 0;
    const cell = readCell(lowest.id, domain, responses, assessedMonths);
    return cell.value * lowest.averageMonths;
  }

  if (!nextAsked) return stage.averageMonths; // reached the top of what we asked

  const cell = readCell(nextAsked.id, domain, responses, assessedMonths);
  return (
    stage.averageMonths + cell.value * (nextAsked.averageMonths - stage.averageMonths)
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * The full result
 * ──────────────────────────────────────────────────────────────────────────*/

export interface ScoreInput {
  child: Child;
  assessedOn: string;
  responses: Record<string, ResponseValue>;
  details?: Record<string, string>;
  /** Stages actually presented, per competence, as the walk recorded them. */
  stagesByDomain: Record<DomainCode, string[]>;
}

export function scoreAssessment(input: ScoreInput): AssessmentResult {
  const { child, assessedOn, responses, stagesByDomain } = input;
  const details = input.details ?? {};
  const age = summariseAge(child.dob, assessedOn, child.gestationalWeeks);
  const months = age.assessedMonths;
  const suppressDq = age.assessedExact < MIN_AGE_FOR_DQ;

  const domainScores: DomainScore[] = DOMAINS.map((domain) => {
    const stageIds = stagesByDomain[domain.code] ?? [];
    const asked = sortStages(stageIds);
    const items = asked.flatMap((s) => itemsFor(s.id, domain.code, months));

    const achieved: Item[] = [];
    const notYet: Item[] = [];
    const observed: Record<string, string> = {};
    let raw = 0;
    let answered = 0;

    for (const item of items) {
      if (item.kind !== "yesno") {
        const note = details[item.id];
        if (note !== undefined && note !== "") observed[item.id] = note;
        continue;
      }
      const v = responses[item.id];
      if (v === undefined) continue;
      const asExpected = item.invert ? 1 - v : v;
      raw += asExpected;
      answered += 1;
      if (asExpected === 1) achieved.push(item);
      else notYet.push(item);
    }

    const { stage } = achievedStageFor(domain.code, stageIds, responses, months);
    const neurologicalMonths = neurologicalAge(
      domain.code,
      stageIds,
      responses,
      months,
    );

    // The chart classifies by the stage reached, not by the interpolation —
    // a child either has a stage or is still working towards it.
    const status: StatusCode = stage
      ? classifyAgainstStage(stage, months)
      : "consult";

    const dq = suppressDq
      ? null
      : Math.round((neurologicalMonths / Math.max(age.assessedExact, 0.5)) * 100);

    return {
      domain: domain.code,
      achievedStage: stage?.id ?? "",
      cell: cellFor(stage?.id ?? BRAIN_STAGES[0].id, domain.code),
      stagesAsked: asked.map((s) => s.id),
      raw,
      max: answered,
      percent: answered === 0 ? 0 : raw / answered,
      neurologicalMonths: Math.round(neurologicalMonths * 10) / 10,
      dq,
      status,
      achieved,
      notYet,
      details: observed,
    };
  });

  const dqs = domainScores.map((d) => d.dq).filter((d): d is number => d !== null);
  const overallDq =
    dqs.length === 0
      ? null
      : Math.round(dqs.reduce((a, b) => a + b, 0) / dqs.length);

  /* The overall verdict is the median of the six, not their mean. Averaging a
     quotient across competences lets one very high number cancel one very low
     one, which is the opposite of what a screener should do. The median says
     what this child is mostly like, and the rule below then refuses to let a
     single struggling competence disappear behind it. */
  const severities = domainScores.map((d) => STATUS_SEVERITY[d.status]).sort((a, b) => a - b);
  const median = Math.ceil(
    (severities[Math.floor((severities.length - 1) / 2)] +
      severities[Math.ceil((severities.length - 1) / 2)]) /
      2,
  );
  let overallStatus: StatusCode = SEVERITY_STATUS[median];

  const statusFromMedian = overallStatus;
  const worstDomain = worstOf(domainScores.map((d) => d.status));
  if (worstDomain === "consult" && STATUS_SEVERITY[overallStatus] < 2) {
    overallStatus = "slow";
  } else if (worstDomain === "slow" && STATUS_SEVERITY[overallStatus] < 1) {
    overallStatus = "average";
  }

  // If the median alone would have read better, name the competence
  // responsible so the report can explain itself rather than looking
  // self-contradictory.
  const overallRaisedBy =
    STATUS_SEVERITY[overallStatus] > STATUS_SEVERITY[statusFromMedian]
      ? ([...domainScores].sort(
          (a, b) => STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status],
        )[0]?.domain ?? null)
      : null;

  const { strengths, focusAreas } = pickHighlights(domainScores);

  const allStages = new Set(Object.values(stagesByDomain).flat());

  return {
    assessedMonths: months,
    chronologicalMonths: age.chronologicalMonths,
    corrected: age.corrected,
    startStage: startStageFor(months).id,
    stages: BRAIN_STAGES.filter((s) => allStages.has(s.id)),
    domainScores,
    overallDq,
    overallStatus,
    overallRaisedBy,
    strengths,
    focusAreas,
    suppressDq,
    answeredCount: domainScores.reduce((n, d) => n + d.max, 0),
  };
}

function worstOf(codes: StatusCode[]): StatusCode {
  return codes.reduce(
    (worst, c) => (STATUS_SEVERITY[c] > STATUS_SEVERITY[worst] ? c : worst),
    "superior" as StatusCode,
  );
}

/**
 * Top two and bottom two competences — but only when the profile is uneven
 * enough for the labels to mean something. A child whose six competences all
 * land within a few points of each other does not have a weakness, and should
 * not be told they do.
 */
function pickHighlights(scores: DomainScore[]): {
  strengths: DomainCode[];
  focusAreas: DomainCode[];
} {
  const metric = (d: DomainScore) =>
    d.dq === null ? (STAGE_BY_ID[d.achievedStage]?.order ?? 0) * 20 : d.dq;
  const values = scores.map(metric);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const SPREAD = 10;

  const sorted = [...scores].sort((a, b) => metric(b) - metric(a));

  const strengths = sorted
    .filter((d) => metric(d) >= mean + SPREAD)
    .slice(0, 2)
    .map((d) => d.domain);

  const focusAreas = [...sorted]
    .reverse()
    .filter(
      (d) =>
        STATUS_SEVERITY[d.status] >= STATUS_SEVERITY.slow || metric(d) <= mean - SPREAD,
    )
    .slice(0, 2)
    .map((d) => d.domain);

  return { strengths, focusAreas };
}
