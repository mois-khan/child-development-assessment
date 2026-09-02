import type { AgeBand, Domain, Module } from "@/lib/types";

/**
 * Six sections, matching the Kaushalya Genius Kid Program's own competence
 * areas (Visual, Auditory, Tactile, Mobility, Language, Manual Competence —
 * the six milestones tracked across every one of the programme's seven
 * phases).
 *
 * Five of the six line up directly with public milestone sources (CDC,
 * NIDCD, WHO), and their item banks are unchanged. "Tactile Competence" has
 * no matching public item bank yet, so this section currently carries the
 * screener's social/emotional & self-regulation content instead — it is
 * flagged below and should be the first thing Kaushalya's team replaces.
 */
export const DOMAINS: Domain[] = [
  {
    code: "vision",
    name: "Visual Competence",
    short: "Visual",
    blurb: "How your child uses their eyes to find, follow and figure things out.",
    scope:
      "Fixation, tracking, visual search, visual-perceptual reasoning, pre-literacy recognition.",
    hue: 258,
    order: 1,
  },
  {
    code: "auditory",
    name: "Auditory Competence",
    short: "Auditory",
    blurb: "How your child responds to sound and takes in what they hear.",
    scope:
      "Auditory awareness, sound localisation, receptive language, following spoken instruction, listening attention.",
    hue: 210,
    order: 2,
  },
  {
    code: "social",
    name: "Tactile Competence",
    short: "Tactile",
    blurb: "How your child relates, responds and self-regulates day to day.",
    scope:
      "Placeholder section — carries the screener's social/emotional & self-regulation content (eye contact, attachment, play, self-regulation) until true tactile/sensory items are authored.",
    hue: 330,
    order: 3,
    placeholder: true,
  },
  {
    code: "mobility",
    name: "Mobility Competence",
    short: "Mobility",
    blurb: "How your child holds themselves up, gets around and stays steady.",
    scope:
      "Gross motor: head control, sitting, crawling, walking, running, climbing, balance, coordination.",
    hue: 24,
    order: 4,
  },
  {
    code: "language",
    name: "Language Competence",
    short: "Language",
    blurb: "How your child makes themselves understood.",
    scope:
      "Expressive language: sounds, babbling, first words, sentence building, conversation, storytelling, speech clarity.",
    hue: 152,
    order: 5,
  },
  {
    code: "hand",
    name: "Manual Competence",
    short: "Manual",
    blurb: "How your child uses their hands and works things out.",
    scope:
      "Fine motor and adaptive: grasp, transfer, pincer grip, tool use, drawing, self-care, practical problem solving.",
    hue: 42,
    order: 6,
  },
];

export const DOMAIN_BY_CODE = Object.fromEntries(
  DOMAINS.map((d) => [d.code, d]),
) as Record<Domain["code"], Domain>;

/**
 * Thirteen age bands across 0-72 months.
 *
 * Each band's upper bound is a CDC "Learn the Signs. Act Early." checkpoint
 * age (2, 4, 6, 9, 12, 15, 18, 24, 30, 36, 48, 60 months), so every item is
 * traceable to a validated age anchor. The final band, 61-72 months, extends
 * past where the CDC checklists stop and is authored from standard school
 * readiness expectations.
 *
 * Bands are narrow in infancy where development moves fastest and widen after
 * age three.
 */
export const AGE_BANDS: AgeBand[] = [
  { id: "b01", label: "0–2 months", minMonths: 0, maxMonths: 2, order: 1 },
  { id: "b02", label: "3–4 months", minMonths: 3, maxMonths: 4, order: 2 },
  { id: "b03", label: "5–6 months", minMonths: 5, maxMonths: 6, order: 3 },
  { id: "b04", label: "7–9 months", minMonths: 7, maxMonths: 9, order: 4 },
  { id: "b05", label: "10–12 months", minMonths: 10, maxMonths: 12, order: 5 },
  { id: "b06", label: "13–15 months", minMonths: 13, maxMonths: 15, order: 6 },
  { id: "b07", label: "16–18 months", minMonths: 16, maxMonths: 18, order: 7 },
  { id: "b08", label: "19–24 months", minMonths: 19, maxMonths: 24, order: 8 },
  { id: "b09", label: "25–30 months", minMonths: 25, maxMonths: 30, order: 9 },
  { id: "b10", label: "31–36 months", minMonths: 31, maxMonths: 36, order: 10 },
  { id: "b11", label: "37–48 months", minMonths: 37, maxMonths: 48, order: 11 },
  { id: "b12", label: "49–60 months", minMonths: 49, maxMonths: 60, order: 12 },
  { id: "b13", label: "61–72 months", minMonths: 61, maxMonths: 72, order: 13 },
];

export const BAND_BY_ID = Object.fromEntries(
  AGE_BANDS.map((b) => [b.id, b]),
) as Record<string, AgeBand>;

/** Activity stages group bands into six spans of shared play patterns. */
export const STAGES: { id: string; label: string; bands: string[] }[] = [
  { id: "s1", label: "0–6 months", bands: ["b01", "b02", "b03"] },
  { id: "s2", label: "7–12 months", bands: ["b04", "b05"] },
  { id: "s3", label: "13–24 months", bands: ["b06", "b07", "b08"] },
  { id: "s4", label: "25–36 months", bands: ["b09", "b10"] },
  { id: "s5", label: "37–48 months", bands: ["b11"] },
  { id: "s6", label: "49–72 months", bands: ["b12", "b13"] },
];

export const STAGE_FOR_BAND: Record<string, string> = Object.fromEntries(
  STAGES.flatMap((s) => s.bands.map((b) => [b, s.id])),
);

/**
 * The programme's seven phases of brain development (Phase I – Phase VII),
 * each covering six milestone areas. Age-at-joining windows are the
 * programme's own (Course Chart, 0–6 years) — narrow in the first year,
 * where development moves fastest, then widening.
 *
 * This is a presentation-layer grouping only: it drives the "Module X of 7"
 * wayfinding a parent sees during the check. The actual question set for a
 * given age still comes from the finer thirteen-band system above, which is
 * what the scoring engine is validated against.
 */
export const MODULES: Module[] = [
  { id: 1, phase: "I", name: "Medulla & Cord", minMonths: 0, maxMonths: 1 },
  { id: 2, phase: "II", name: "Pons", minMonths: 1, maxMonths: 3 },
  { id: 3, phase: "III", name: "Mid-Brain", minMonths: 3, maxMonths: 7 },
  { id: 4, phase: "IV", name: "Initial Cortex", minMonths: 7, maxMonths: 12 },
  { id: 5, phase: "V", name: "Early Cortex", minMonths: 12, maxMonths: 18 },
  { id: 6, phase: "VI", name: "Primitive Cortex", minMonths: 18, maxMonths: 36 },
  { id: 7, phase: "VII", name: "Sophisticated Cortex", minMonths: 36, maxMonths: 72 },
];

export function moduleForAge(months: number): Module {
  const found = MODULES.find((m) => months <= m.maxMonths);
  return found ?? MODULES[MODULES.length - 1];
}

/**
 * Which of the thirteen age bands feed each module, precomputed once by
 * date-range overlap (a band belongs to a module if their month ranges
 * touch at all). This is the actual module → section → question backend:
 * every module ends up with a fixed, non-empty, deterministic question set
 * for each of the six sections, computed from age alone — nothing here
 * grows or changes once the child's module is resolved.
 */
export const MODULE_BANDS: Record<number, AgeBand[]> = Object.fromEntries(
  MODULES.map((m) => [
    m.id,
    AGE_BANDS.filter((b) => b.minMonths <= m.maxMonths && b.maxMonths >= m.minMonths),
  ]),
);

export function bandIdsForModule(moduleId: number): string[] {
  return (MODULE_BANDS[moduleId] ?? []).map((b) => b.id);
}
