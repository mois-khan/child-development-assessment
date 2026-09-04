import type { BrainStage, CompetenceCode, StageCell } from "@/lib/types";

/**
 * The Developmental Profile — seven stages of brain development, six
 * competences, forty-two cells.
 *
 * This is a direct transcription of the programme's own wall chart (Ru
 * Education Pvt Ltd), which is also the front page of the paper assessment
 * booklet families already fill in by hand. It is the north star for the whole
 * engine: the chart decides which questions are asked, what a child's result
 * means, and what the report looks like.
 *
 * Nothing in this file is invented. If a number or a phrase here disagrees with
 * the printed chart, the printed chart is right and this file is a bug.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * The seven stages, and their time frames
 *
 * Each stage carries three ages from the chart's TIME FRAME column: the age a
 * SUPERIOR child reaches this stage, the age an AVERAGE child reaches it, and
 * the age a SLOW child reaches it. These three numbers do all the work:
 *
 *   - `averageMonths` picks which stage a child starts the assessment at
 *     (nearest average wins — see lib/stage.ts)
 *   - `averageMonths` of the stage a child actually reaches is their
 *     neurological age, which is what the developmental quotient divides
 *   - all three together classify the result, with no invented thresholds:
 *     reach stage IV at 6 months and you are superior, at 12 average, at 24
 *     slow, and past 24 it is worth a closer look
 *
 * Stage I's superior/average/slow are printed on the chart as ranges from
 * birth (birth–0.5, birth–1.0, birth–2.0); the upper bound is what matters and
 * is what is recorded here.
 * ──────────────────────────────────────────────────────────────────────────*/

export const BRAIN_STAGES: BrainStage[] = [
  {
    id: "s1",
    order: 1,
    roman: "I",
    name: "Medulla and Cord",
    superiorMonths: 0.5,
    averageMonths: 1,
    slowMonths: 2,
    hue: 0,
  },
  {
    id: "s2",
    order: 2,
    roman: "II",
    name: "Pons",
    superiorMonths: 1,
    averageMonths: 2.5,
    slowMonths: 5,
    hue: 24,
  },
  {
    id: "s3",
    order: 3,
    roman: "III",
    name: "Mid-Brain",
    superiorMonths: 3.5,
    averageMonths: 7,
    slowMonths: 14,
    hue: 50,
  },
  {
    id: "s4",
    order: 4,
    roman: "IV",
    name: "Initial Cortex",
    superiorMonths: 6,
    averageMonths: 12,
    slowMonths: 24,
    hue: 140,
  },
  {
    id: "s5",
    order: 5,
    roman: "V",
    name: "Early Cortex",
    superiorMonths: 9,
    averageMonths: 18,
    slowMonths: 36,
    hue: 195,
  },
  {
    id: "s6",
    order: 6,
    roman: "VI",
    name: "Primitive Cortex",
    superiorMonths: 18,
    averageMonths: 36,
    slowMonths: 72,
    hue: 235,
  },
  {
    id: "s7",
    order: 7,
    roman: "VII",
    name: "Sophisticated Cortex",
    superiorMonths: 36,
    averageMonths: 72,
    slowMonths: 144,
    hue: 292,
  },
];

export const STAGE_BY_ID = Object.fromEntries(
  BRAIN_STAGES.map((s) => [s.id, s]),
) as Record<string, BrainStage>;

export const FIRST_STAGE = BRAIN_STAGES[0];
export const LAST_STAGE = BRAIN_STAGES[BRAIN_STAGES.length - 1];

/** The stage one step up, or null at the top of the chart. */
export function stageAbove(stage: BrainStage): BrainStage | null {
  return BRAIN_STAGES[stage.order] ?? null; // order is 1-based, so [order] is the next one
}

/** The stage one step down, or null at the bottom of the chart. */
export function stageBelow(stage: BrainStage): BrainStage | null {
  return BRAIN_STAGES[stage.order - 2] ?? null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * The forty-two cells
 *
 * Every cell on the chart carries a number (1–42, counting up the rows), the
 * competence it describes, and the italic line beneath it naming the kind of
 * function that stage represents. Both are printed on the physical chart, so a
 * parent holding the paper version can find the exact box the report is
 * talking about.
 * ──────────────────────────────────────────────────────────────────────────*/

const CELL_ROWS: {
  stage: string;
  cells: Record<CompetenceCode, [number: number, competence: string, kind: string]>;
}[] = [
  {
    stage: "s1",
    cells: {
      vision: [1, "Light reflex", "Reflex reception"],
      auditory: [2, "Startle reflex", "Reflex reception"],
      tactile: [3, "Babinski reflex", "Reflex reception"],
      mobility: [4, "Movement of arms and legs without bodily movement", "Reflex response"],
      language: [5, "Birth cry and crying", "Reflex response"],
      hand: [6, "Grasp reflex", "Reflex response"],
    },
  },
  {
    stage: "s2",
    cells: {
      vision: [7, "Outline perception", "Vital perception"],
      auditory: [8, "Vital response to threatening sounds", "Vital perception"],
      tactile: [9, "Perception of vital sensation", "Vital perception"],
      mobility: [
        10,
        "Crawling in the prone position culminating in cross pattern crawling",
        "Vital response",
      ],
      language: [11, "Vital crying in response to threats to life", "Vital response"],
      hand: [12, "Vital release", "Vital response"],
    },
  },
  {
    stage: "s3",
    cells: {
      vision: [13, "Appreciation of detail within a configuration", "Meaningful appreciation"],
      auditory: [14, "Appreciation of meaningful sounds", "Meaningful appreciation"],
      tactile: [15, "Appreciation of gnostic sensation", "Meaningful appreciation"],
      mobility: [
        16,
        "Creeping on hands and knees, culminating in cross pattern creeping",
        "Meaningful response",
      ],
      language: [17, "Creation of meaningful sounds", "Meaningful response"],
      hand: [18, "Prehensile grasp", "Meaningful response"],
    },
  },
  {
    stage: "s4",
    cells: {
      vision: [
        19,
        "Convergence of vision resulting in simple depth perception",
        "Initial human understanding",
      ],
      auditory: [20, "Understanding of two words of speech", "Initial human understanding"],
      tactile: [
        21,
        "Tactile understanding of the third dimension in objects which appear to be flat",
        "Initial human understanding",
      ],
      mobility: [
        22,
        "Walking with arms in a primary balance role most frequently at or above shoulder height",
        "Initial human expression",
      ],
      language: [
        23,
        "Two words of speech used spontaneously and meaningfully",
        "Initial human expression",
      ],
      hand: [24, "Cortical opposition in either hand", "Initial human expression"],
    },
  },
  {
    stage: "s5",
    cells: {
      vision: [
        25,
        "Differentiation of similar but unlike simple visual symbols",
        "Early human understanding",
      ],
      auditory: [
        26,
        "Understanding of 10 to 25 words and two word couplets",
        "Early human understanding",
      ],
      tactile: [
        27,
        "Tactile differentiation of similar but unlike objects",
        "Early human understanding",
      ],
      mobility: [
        28,
        "Walking with arms freed from the primary balance role",
        "Early human expression",
      ],
      language: [
        29,
        "10 to 25 words of language and two word couplets",
        "Early human expression",
      ],
      hand: [
        30,
        "Cortical opposition bilaterally and simultaneously",
        "Early human expression",
      ],
    },
  },
  {
    stage: "s6",
    cells: {
      vision: [
        31,
        "Identification of visual symbols and letters within experience",
        "Primitive human understanding",
      ],
      auditory: [
        32,
        "Understanding of 2000 words and simple sentences",
        "Primitive human understanding",
      ],
      tactile: [
        33,
        "Ability to determine characteristics of objects by tactile means",
        "Primitive human understanding",
      ],
      mobility: [
        34,
        "Walking and running in complete cross pattern",
        "Primitive human expression",
      ],
      language: [35, "2000 words of language and short sentences", "Primitive human expression"],
      hand: [
        36,
        "Bimanual function with one hand in a skilled role",
        "Primitive human expression",
      ],
    },
  },
  {
    stage: "s7",
    cells: {
      vision: [37, "Reading with total understanding", "Sophisticated human understanding"],
      auditory: [
        38,
        "Understanding of complete vocabulary and proper sentences",
        "Sophisticated human understanding",
      ],
      tactile: [39, "Tactile identification of objects", "Sophisticated human understanding"],
      mobility: [
        40,
        "Using a leg in a skilled role which is consistent with the dominant hemisphere",
        "Sophisticated human expression",
      ],
      language: [
        41,
        "Complete vocabulary and proper sentence structure",
        "Sophisticated human expression",
      ],
      hand: [
        42,
        "Using a hand to write which is consistent with the dominant hemisphere",
        "Sophisticated human expression",
      ],
    },
  },
];

export const STAGE_CELLS: StageCell[] = CELL_ROWS.flatMap((row) =>
  (Object.entries(row.cells) as [CompetenceCode, [number, string, string]][]).map(
    ([competence, [number, description, kind]]) => ({
      number,
      stage: row.stage,
      competence,
      description,
      kind,
    }),
  ),
);

const CELL_LOOKUP = new Map(
  STAGE_CELLS.map((c) => [`${c.stage}:${c.competence}`, c]),
);

/** The chart cell for one stage and one competence. Always defined — all 42 exist. */
export function cellFor(stage: string, competence: CompetenceCode): StageCell {
  return CELL_LOOKUP.get(`${stage}:${competence}`)!;
}

/** "1 month" / "2.5 months" / "6 years" — for the time-frame column on reports. */
export function formatStageMonths(months: number): string {
  if (months >= 24 && Number.isInteger(months / 12)) {
    const y = months / 12;
    return `${y} year${y === 1 ? "" : "s"}`;
  }
  const n = Number.isInteger(months) ? `${months}` : `${months}`;
  return `${n} month${months === 1 ? "" : "s"}`;
}
