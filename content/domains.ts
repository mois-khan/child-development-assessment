import type { AgeBand, Domain } from "@/lib/types";

/**
 * Six assessed aspects.
 *
 * These are placeholders pending Kaushalya's own domain list. They cover the
 * four aspects named in the brief (auditory, mobility, reactive, language and
 * communication) plus vision and hand skills, which the public milestone
 * sources treat as separate strands.
 *
 * The CDC groups milestones into four areas (social/emotional, language/
 * communication, cognitive, movement/physical). Cognitive items are split here
 * between `hand` (manipulative problem solving, as in Denver's "fine motor -
 * adaptive") and `vision` (visual-perceptual reasoning).
 */
export const DOMAINS: Domain[] = [
  {
    code: "auditory",
    name: "Listening & Understanding",
    short: "Listening",
    blurb: "How your child responds to sound and takes in what they hear.",
    scope:
      "Auditory awareness, sound localisation, receptive language, following spoken instruction, listening attention.",
    hue: 188,
    order: 1,
  },
  {
    code: "vision",
    name: "Seeing & Noticing",
    short: "Seeing",
    blurb: "How your child uses their eyes to find, follow and figure things out.",
    scope:
      "Fixation, tracking, visual search, visual-perceptual reasoning, pre-literacy recognition.",
    hue: 258,
    order: 2,
  },
  {
    code: "mobility",
    name: "Moving & Balance",
    short: "Moving",
    blurb: "How your child holds themselves up, gets around and stays steady.",
    scope:
      "Gross motor: head control, sitting, crawling, walking, running, climbing, balance, coordination.",
    hue: 24,
    order: 3,
  },
  {
    code: "hand",
    name: "Hands & Problem Solving",
    short: "Hands",
    blurb: "How your child uses their hands and works things out.",
    scope:
      "Fine motor and adaptive: grasp, transfer, pincer grip, tool use, drawing, self-care, practical problem solving.",
    hue: 42,
    order: 4,
  },
  {
    code: "language",
    name: "Talking & Communication",
    short: "Talking",
    blurb: "How your child makes themselves understood.",
    scope:
      "Expressive language: sounds, babbling, first words, sentence building, conversation, storytelling, speech clarity.",
    hue: 340,
    order: 5,
  },
  {
    code: "social",
    name: "Connecting & Responding",
    short: "Connecting",
    blurb: "How your child relates to you and to other children.",
    scope:
      "Social-emotional and behavioural response: eye contact, attachment, stranger response, play, imitation, self-regulation.",
    hue: 152,
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
