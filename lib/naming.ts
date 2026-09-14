import type { BrainStage } from "./types";

/* ────────────────────────────────────────────────────────────────────────────
 * What things are called — one place, so a rename is a one-file change.
 *
 * There is a deliberate split between the words a parent reads and the words
 * the code uses, and it is worth stating plainly because it looks like an
 * inconsistency until you know why:
 *
 *   Parents see  "Phase IV"
 *   Code says    stage, BrainStage, stageForAge, stagesByDomain
 *   Database has start_stage, stages_by_domain, stage_id
 *   The chart     prints "STAGE" in its own left-hand column
 *
 * The engine is a transcription of a printed chart (content/stages.ts) whose
 * own vocabulary is "stage", and four database columns are named after it.
 * Renaming 800-odd identifiers and migrating those columns would change
 * nothing a parent can see, while putting the one part of this system that
 * must not break — the instrument itself — through a rename for the sake of
 * a caption. So "phase" is a display word, and it is applied here.
 *
 * The same split applies to the score. The engine computes a developmental
 * quotient and calls it `dq` — that is the standard term for what it is, a
 * neurological age divided by a real age. But "quotient" is a statistician's
 * word, and a parent reading it has to be taught what it means before the
 * number helps them. Parents see "development score" instead.
 *
 * The rule: anything a parent or school can read says Phase and development
 * score, and gets those words from this file. Anything the engine reasons
 * about stays a stage and a dq.
 * ──────────────────────────────────────────────────────────────────────────*/

/** The platform's full name, as it appears on the cover and in metadata. */
export const PLATFORM_NAME = "Kaushalya Developmental Screening Platform";

/** The abbreviation used in report names — "Kaushik KDSP-IV Report". */
export const PLATFORM_SHORT = "KDSP";

/** The programme behind the platform. Courses belong to it, not to KDSP. */
export const PROGRAMME_NAME = "Kaushalya Genius Kid Program";

/** Parent-facing word for what the code calls a stage. */
export const PHASE_WORD = "Phase";

/** Parent-facing name for what the code calls the developmental quotient. */
export const SCORE_WORD = "Development score";

/**
 * The one line that explains the score, wherever it is shown. Every place the
 * number appears has to carry it — a bare "121" is unreadable without knowing
 * that 100 is the middle.
 */
export const SCORE_HINT = "100 is on track for age";

/**
 * A phase named the way a parent reads it: "Phase IV · Initial Cortex".
 * Pass `withName: false` for tight spaces where the roman numeral is enough.
 */
export function phaseLabel(stage: BrainStage, withName = true): string {
  return withName ? `${PHASE_WORD} ${stage.roman} · ${stage.name}` : `${PHASE_WORD} ${stage.roman}`;
}

/**
 * The name of one report — the single format used on the cover, in the
 * browser tab, on the saved PDF, and in every list a report appears in.
 *
 * "Kaushik KDSP-IV Report"
 *
 * The phase is the one the child's AGE places them in, not the one they
 * scored at. Two reasons: it is the same phase the course recommendation is
 * keyed to, and it is a single stable number — a scored phase differs across
 * the six competences, so there is no one numeral to put in a title.
 */
export function reportName(childName: string, stage: BrainStage): string {
  return `${childName} ${PLATFORM_SHORT}-${stage.roman} Report`;
}
