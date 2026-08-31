import { AGE_BANDS, DOMAINS } from "@/content/domains";
import { itemsFor } from "@/content/items";
import type {
  AgeBand,
  AssessmentResult,
  Child,
  DomainCode,
  DomainScore,
  Item,
  ResponseValue,
  Status,
  StatusCode,
} from "./types";
import { summariseAge } from "./age";

/* ────────────────────────────────────────────────────────────────────────────
 * Constants. These are clinical judgements, not engineering ones. They are
 * defensible defaults drawn from standard screening practice, and Kaushalya's
 * child development lead should confirm them before any real family sees a
 * result.
 * ──────────────────────────────────────────────────────────────────────────*/

/** Share of a band's points a child needs to count as having mastered it. */
export const MASTERY_THRESHOLD = 0.75;

/** Below this age a developmental quotient is too unstable to report. */
export const MIN_AGE_FOR_DQ = 4;

/**
 * Mastery at or above this on the highest band asked triggers a higher band.
 * There is no matching floor constant: we reach downwards whenever the lowest
 * band asked was not mastered, which is the basal rule itself.
 */
export const CEILING_TRIGGER = 0.9;

/** Safety stop, so a child who answers "not yet" to everything terminates. */
export const MAX_EXTENSION_ROUNDS = 4;

export const STATUSES: Record<StatusCode, Status> = {
  on_track: {
    code: "on_track",
    label: "On track",
    meaning: "Doing what we would expect at this age, or ahead of it.",
  },
  emerging: {
    code: "emerging",
    label: "Emerging",
    meaning:
      "A little behind the typical range. Targeted play at home, and check again in three months.",
  },
  needs_focus: {
    code: "needs_focus",
    label: "Needs focus",
    meaning:
      "Meaningfully behind. Worth daily focused activity, and worth mentioning at the next visit to your doctor.",
  },
  consult: {
    code: "consult",
    label: "Worth a closer look",
    meaning:
      "We suggest an assessment by a developmental paediatrician or therapist. This is a screening result, not a diagnosis.",
  },
};

const STATUS_SEVERITY: Record<StatusCode, number> = {
  on_track: 0,
  emerging: 1,
  needs_focus: 2,
  consult: 3,
};

export function statusFromDq(dq: number): StatusCode {
  if (dq >= 90) return "on_track";
  if (dq >= 75) return "emerging";
  if (dq >= 60) return "needs_focus";
  return "consult";
}

/* ────────────────────────────────────────────────────────────────────────────
 * Band selection
 * ──────────────────────────────────────────────────────────────────────────*/

export function bandForAge(months: number): AgeBand {
  const found = AGE_BANDS.find(
    (b) => months >= b.minMonths && months <= b.maxMonths,
  );
  if (found) return found;
  return months < AGE_BANDS[0].minMonths
    ? AGE_BANDS[0]
    : AGE_BANDS[AGE_BANDS.length - 1];
}

/**
 * The three-band assessment window: the band below the child's age (skills
 * that should already be consolidated), the band at their age (what is
 * expected now), and the band above (headroom, so strengths show up too).
 *
 * Testing only the child's own band would tell a parent that something is
 * wrong without telling them where their child actually is, which is the one
 * thing they need in order to act.
 */
export const WINDOW_WIDTH = 3;

export function initialWindow(assessedMonths: number): AgeBand[] {
  const current = bandForAge(assessedMonths);
  const i = AGE_BANDS.findIndex((b) => b.id === current.id);

  // Keep the window a full three bands wide by sliding it when the child sits
  // at either end of the range, rather than truncating it. A child in the top
  // band has no headroom above, so the extra band has to come from below or
  // the developmental age estimate has nowhere to land.
  let from = i - 1;
  if (from < 0) from = 0;
  if (from + WINDOW_WIDTH > AGE_BANDS.length) {
    from = Math.max(0, AGE_BANDS.length - WINDOW_WIDTH);
  }
  return AGE_BANDS.slice(from, from + WINDOW_WIDTH);
}

function mastery(
  band: string,
  domain: DomainCode,
  responses: Record<string, ResponseValue>,
): { value: number; answered: number } {
  const items = itemsFor(band, domain);
  let raw = 0;
  let answered = 0;
  for (const item of items) {
    const v = responses[item.id];
    if (v === undefined) continue;
    raw += v;
    answered += 1;
  }
  // Unanswered items leave the denominator rather than scoring as zero.
  return { value: answered === 0 ? 0 : raw / (answered * 2), answered };
}

/**
 * Which extra bands a child needs next, per domain, given what has been asked
 * so far. Returns only bands not already present, so it can be called after
 * each round until it comes back empty.
 *
 * Downwards, this is the basal rule: until the child masters the lowest band
 * they were asked, we do not know where they actually are, and the estimate is
 * pinned to the bottom of the range we happened to choose. Reaching down one
 * band at a time until they master one is what makes the developmental age
 * meaningful rather than an artefact of the starting window.
 *
 * Upwards it is the ceiling rule, and one band is enough: a child at the top of
 * the window has headroom we did not measure, but knowing they are at least
 * that far ahead is all the report needs.
 */
export function extensionsFor(
  bandsByDomain: Record<DomainCode, string[]>,
  responses: Record<string, ResponseValue>,
): Record<DomainCode, string[]> {
  const out = {} as Record<DomainCode, string[]>;

  for (const domain of DOMAINS) {
    const extra: string[] = [];
    const asked = AGE_BANDS.filter((b) =>
      (bandsByDomain[domain.code] ?? []).includes(b.id),
    );
    if (asked.length === 0) {
      out[domain.code] = extra;
      continue;
    }

    const lowest = asked[0];
    const highest = asked[asked.length - 1];
    const lowIdx = AGE_BANDS.findIndex((b) => b.id === lowest.id);
    const highIdx = AGE_BANDS.findIndex((b) => b.id === highest.id);

    const low = mastery(lowest.id, domain.code, responses);
    const high = mastery(highest.id, domain.code, responses);

    if (low.answered > 0 && low.value < MASTERY_THRESHOLD && lowIdx > 0) {
      extra.push(AGE_BANDS[lowIdx - 1].id);
    }
    if (
      high.answered > 0 &&
      high.value >= CEILING_TRIGGER &&
      highIdx < AGE_BANDS.length - 1
    ) {
      extra.push(AGE_BANDS[highIdx + 1].id);
    }
    out[domain.code] = extra;
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Developmental age
 * ──────────────────────────────────────────────────────────────────────────*/

/**
 * Estimate a developmental age in months for one domain.
 *
 * Walk the bands the child was actually asked, lowest first. The highest band
 * they mastered — with every asked band below it also mastered — sets the
 * base. Partial credit from the next band up interpolates within it.
 *
 * A child who fully masters 19-24 months and scores 40% on 25-30 months lands
 * at 24 + 0.4 x (30 - 24) = 26.4 months.
 */
export function developmentalAge(
  bands: AgeBand[],
  domain: DomainCode,
  responses: Record<string, ResponseValue>,
): { months: number; bounded: "floor" | "ceiling" | null } {
  const asked = bands
    .filter((b) => mastery(b.id, domain, responses).answered > 0)
    .sort((a, b) => a.order - b.order);

  if (asked.length === 0) return { months: 0, bounded: "floor" };

  let baseIdx = -1;
  for (let i = 0; i < asked.length; i++) {
    if (mastery(asked[i].id, domain, responses).value >= MASTERY_THRESHOLD) {
      baseIdx = i;
    } else {
      break; // basal rule: stop at the first band not mastered
    }
  }

  // Mastered nothing we asked about. Running the basal rule to completion
  // makes this rare: it means either we reached the very first band, or the
  // extension hit its round cap. Either way the child sits somewhere below the
  // bottom of what we asked, so interpolate across that unknown range and flag
  // the estimate as bounded.
  if (baseIdx === -1) {
    const lowest = asked[0];
    const m = mastery(lowest.id, domain, responses).value;
    const lowIdx = AGE_BANDS.findIndex((b) => b.id === lowest.id);
    // At the very first band there is nothing below, so the band's own span is
    // the range. Otherwise everything below it is unmeasured.
    const ceiling = lowIdx === 0 ? lowest.maxMonths : lowest.minMonths;
    return { months: m * ceiling, bounded: "floor" };
  }

  const base = asked[baseIdx].maxMonths;
  const next = asked[baseIdx + 1];

  // Mastered everything we asked, including the top band.
  if (!next) return { months: base, bounded: "ceiling" };

  const m = mastery(next.id, domain, responses).value;
  return { months: base + m * (next.maxMonths - base), bounded: null };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Full result
 * ──────────────────────────────────────────────────────────────────────────*/

export interface ScoreInput {
  child: Child;
  assessedOn: string;
  responses: Record<string, ResponseValue>;
  /** Bands actually presented, per domain. */
  bandsByDomain: Record<DomainCode, string[]>;
}

export function scoreAssessment(input: ScoreInput): AssessmentResult {
  const { child, assessedOn, responses, bandsByDomain } = input;
  const age = summariseAge(child.dob, assessedOn, child.gestationalWeeks);
  const suppressDq = age.assessedMonths < MIN_AGE_FOR_DQ;

  const domainScores: DomainScore[] = DOMAINS.map((domain) => {
    const bandIds = bandsByDomain[domain.code] ?? [];
    const bands = AGE_BANDS.filter((b) => bandIds.includes(b.id));
    const items = bands.flatMap((b) => itemsFor(b.id, domain.code));

    let raw = 0;
    let answered = 0;
    const achieved: Item[] = [];
    const emerging: Item[] = [];
    const notYet: Item[] = [];

    for (const item of items) {
      const v = responses[item.id];
      if (v === undefined) continue;
      raw += v;
      answered += 1;
      if (v === 2) achieved.push(item);
      else if (v === 1) emerging.push(item);
      else notYet.push(item);
    }

    const max = answered * 2;
    const percent = max === 0 ? 0 : raw / max;
    const { months } = developmentalAge(bands, domain.code, responses);

    let dq: number | null = null;
    let status: StatusCode;
    if (suppressDq) {
      // Too young for a stable ratio — fall back to plain achievement.
      status =
        percent >= 0.75 ? "on_track" : percent >= 0.5 ? "emerging" : "needs_focus";
    } else {
      dq = Math.round((months / age.assessedExact) * 100);
      status = statusFromDq(dq);
    }

    return {
      domain: domain.code,
      raw,
      max,
      percent,
      developmentalMonths: Math.round(months * 10) / 10,
      dq,
      status,
      achieved,
      emerging,
      notYet,
    };
  });

  const dqs = domainScores
    .map((d) => d.dq)
    .filter((d): d is number => d !== null);
  const overallDq =
    dqs.length === 0 ? null : Math.round(dqs.reduce((a, b) => a + b, 0) / dqs.length);

  // A single weak domain must not be averaged away. One domain at 55 with five
  // at 95 averages to a comfortable-looking 88, and that child needs attention.
  let overallStatus: StatusCode = overallDq === null
    ? worstOf(domainScores.map((d) => d.status))
    : statusFromDq(overallDq);

  const statusFromAverage = overallStatus;
  const worstDomain = worstOf(domainScores.map((d) => d.status));
  if (worstDomain === "consult" && STATUS_SEVERITY[overallStatus] < 2) {
    overallStatus = "needs_focus";
  } else if (worstDomain === "needs_focus" && STATUS_SEVERITY[overallStatus] < 1) {
    overallStatus = "emerging";
  }

  // If the average alone would have read better, name the domain responsible
  // so the report can explain itself rather than looking self-contradictory.
  const overallRaisedBy =
    STATUS_SEVERITY[overallStatus] > STATUS_SEVERITY[statusFromAverage]
      ? ([...domainScores].sort(
          (a, b) => STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status],
        )[0]?.domain ?? null)
      : null;

  const { strengths, focusAreas } = pickHighlights(domainScores);

  const answeredCount = domainScores.reduce((n, d) => n + d.max / 2, 0);
  const totalCount = DOMAINS.reduce((n, domain) => {
    const bandIds = bandsByDomain[domain.code] ?? [];
    return n + bandIds.reduce((k, b) => k + itemsFor(b, domain.code).length, 0);
  }, 0);

  return {
    assessedMonths: age.assessedMonths,
    chronologicalMonths: age.chronologicalMonths,
    corrected: age.corrected,
    bands: AGE_BANDS.filter((b) =>
      Object.values(bandsByDomain).some((ids) => ids.includes(b.id)),
    ),
    domainScores,
    overallDq,
    overallStatus,
    overallRaisedBy,
    strengths,
    focusAreas,
    suppressDq,
    answeredCount,
    totalCount,
  };
}

function worstOf(codes: StatusCode[]): StatusCode {
  return codes.reduce(
    (worst, c) => (STATUS_SEVERITY[c] > STATUS_SEVERITY[worst] ? c : worst),
    "on_track" as StatusCode,
  );
}

/**
 * Top two and bottom two domains — but only when the profile is uneven enough
 * for the labels to mean something. A child whose six domains are all within a
 * few points of each other does not have a weakness, and should not be told
 * they do.
 */
function pickHighlights(scores: DomainScore[]): {
  strengths: DomainCode[];
  focusAreas: DomainCode[];
} {
  const metric = (d: DomainScore) => (d.dq === null ? d.percent * 100 : d.dq);
  const values = scores.map(metric);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const SPREAD = 5;

  const sorted = [...scores].sort((a, b) => metric(b) - metric(a));

  const strengths = sorted
    .filter((d) => metric(d) >= mean + SPREAD)
    .slice(0, 2)
    .map((d) => d.domain);

  const focusAreas = [...sorted]
    .reverse()
    .filter((d) => d.status !== "on_track" || metric(d) <= mean - SPREAD)
    .slice(0, 2)
    .map((d) => d.domain);

  return { strengths, focusAreas };
}
