import type { Domain } from "@/lib/types";
import { BRAIN_STAGES } from "./stages";

/**
 * The six competences of the Developmental Profile, in the chart's own column
 * order: Visual, Auditory, Tactile, Mobility, Language, Manual.
 *
 * The chart splits them into three that take information IN (visual, auditory,
 * tactile — the "understanding" side) and three that put it back OUT
 * (mobility, language, manual — the "expression" side). That split is worth
 * keeping visible on the report, because a child strong on one side and weak
 * on the other means something different from a child who is even.
 */
export const DOMAINS: Domain[] = [
  {
    code: "vision",
    name: "Visual Competence",
    short: "Visual",
    blurb: "How your child uses their eyes to find, follow and figure things out.",
    scope:
      "Light reflex, outline perception, detail within a configuration, depth perception, symbol differentiation, letter identification, reading.",
    hue: 258,
    order: 1,
  },
  {
    code: "auditory",
    name: "Auditory Competence",
    short: "Auditory",
    blurb: "How your child responds to sound and takes in what they hear.",
    scope:
      "Startle reflex, response to threatening sounds, appreciation of meaningful sounds, word understanding, couplets, sentences, full vocabulary.",
    hue: 210,
    order: 2,
  },
  {
    code: "tactile",
    name: "Tactile Competence",
    short: "Tactile",
    blurb: "How your child takes in the world through touch.",
    scope:
      "Babinski reflex, vital sensation, gnostic sensation, third-dimension understanding, tactile differentiation, object characteristics, identification by touch.",
    hue: 330,
    order: 3,
  },
  {
    code: "mobility",
    name: "Mobility Competence",
    short: "Mobility",
    blurb: "How your child gets around and stays steady.",
    scope:
      "Reflex movement, cross pattern crawling, cross pattern creeping, independent walking, arms freed from balance, cross pattern walking and running, skilled leg use.",
    hue: 24,
    order: 4,
  },
  {
    code: "language",
    name: "Language Competence",
    short: "Language",
    blurb: "How your child makes themselves understood.",
    scope:
      "Birth cry, vital cry, meaningful sounds, first two words, 10–25 words and couplets, 2000 words and sentences, complete vocabulary.",
    hue: 152,
    order: 5,
  },
  {
    code: "hand",
    name: "Manual Competence",
    short: "Manual",
    blurb: "How your child uses their hands.",
    scope:
      "Grasp reflex, vital release, prehensile grasp, cortical opposition in either hand, bilateral opposition, bimanual skilled function, writing.",
    hue: 42,
    order: 6,
  },
];

export const DOMAIN_BY_CODE = Object.fromEntries(
  DOMAINS.map((d) => [d.code, d]),
) as Record<Domain["code"], Domain>;

/** The chart's own split: what goes in, and what comes back out. */
export const INPUT_DOMAINS = ["vision", "auditory", "tactile"] as const;
export const OUTPUT_DOMAINS = ["mobility", "language", "hand"] as const;

/**
 * The seven stages in the shape the homepage journey diagram wants —
 * "Pons · 2.5 mo". The age shown is the chart's average column, which is the
 * age this stage is reached by a typical child.
 */
export const STAGE_JOURNEY = BRAIN_STAGES.map((s) => ({
  roman: s.roman,
  name: s.name,
  ageLabel: stageAgeLabel(s.averageMonths),
}));

/** "2.5 mo" / "3 yr" — short enough to sit under a diagram node. */
export function stageAgeLabel(months: number): string {
  if (months < 24) return `${months} mo`;
  const y = months / 12;
  return `${Number.isInteger(y) ? y : y.toFixed(1)} yr`;
}
