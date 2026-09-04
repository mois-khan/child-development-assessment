/**
 * Builds a demo assessment record and prints it as JSON, for pasting into
 * localStorage under "kaushalya.assessments.v2". Used to look at the report
 * without answering the whole booklet by hand.
 *
 *   npx tsx scripts/seed-demo.ts
 */
import { DOMAINS } from "@/content/domains";
import { BANK_VERSION, scoredItemsFor } from "@/content/items";
import { nextStageFor, startStageFor } from "@/lib/scoring";
import { summariseAge } from "@/lib/age";
import type { DomainCode, ResponseValue } from "@/lib/types";

const child = { name: "Aarav", dob: "2024-07-01", gender: "boy" as const };
const assessedOn = "2026-09-01";

const months = summariseAge(child.dob, assessedOn, undefined).assessedMonths;
const start = startStageFor(months);

/**
 * How far up the chart this demo child actually is, per competence — the
 * highest stage they pass. Everything at or below it answers yes, everything
 * above it answers no, which is what a real profile looks like.
 *
 * A deliberately uneven profile: motor and manual ahead, language well behind,
 * so the report has something to say about strengths and focus areas both.
 */
const REACHES: Record<DomainCode, number> = {
  mobility: 6,
  hand: 6,
  tactile: 5,
  vision: 5,
  auditory: 4,
  language: 3,
};

const responses: Record<string, ResponseValue> = {};
const stagesByDomain = {} as Record<DomainCode, string[]>;

function answerStage(domain: DomainCode, stage: string) {
  const order = Number(stage.slice(1));
  const passes = order <= REACHES[domain];
  for (const item of scoredItemsFor(stage, domain, months)) {
    // Inverted questions are answered so the child comes out the same way.
    responses[item.id] = (item.invert ? 1 - Number(passes) : Number(passes)) as ResponseValue;
  }
}

// Run exactly the walk the assessment runs, one competence at a time.
for (const d of DOMAINS) {
  const asked: string[] = [];
  let next = nextStageFor(d.code, asked, responses, months);
  let guard = 0;
  while (next && guard < 10) {
    asked.push(next.id);
    answerStage(d.code, next.id);
    next = nextStageFor(d.code, asked, responses, months);
    guard += 1;
  }
  stagesByDomain[d.code] = asked;
}

const record = {
  id: "demo",
  child,
  assessedOn,
  responses,
  details: {},
  stagesByDomain,
  bankVersion: BANK_VERSION,
  completedAt: `${assessedOn}T10:00:00.000Z`,
};

console.error(
  `seeded: ${child.name} at ${months} months, starting at stage ${start.roman}, ${Object.keys(responses).length} answers`,
);
for (const d of DOMAINS) {
  console.error(
    `  ${d.code.padEnd(9)} asked: ${stagesByDomain[d.code].join(" ") || "(none)"}`,
  );
}
console.log(JSON.stringify({ demo: record }));
