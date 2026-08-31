/**
 * Builds a demo assessment record and prints it as JSON, for pasting into
 * localStorage under "kaushalya.assessments.v1". Used to look at the report
 * without answering seventy questions by hand.
 *
 *   npx tsx scripts/seed-demo.ts
 */
import { DOMAINS } from "@/content/domains";
import { BANK_VERSION, itemsFor } from "@/content/items";
import { MAX_EXTENSION_ROUNDS, extensionsFor, initialWindow } from "@/lib/scoring";
import { summariseAge } from "@/lib/age";
import type { DomainCode, ResponseValue } from "@/lib/types";

const child = { name: "Aarav", dob: "2024-07-01", gender: "boy" as const };
const assessedOn = "2026-09-01";

// A realistic uneven profile: solid motor and social, language well behind.
const PLAN: Record<DomainCode, Record<string, ResponseValue>> = {
  mobility: { b08: 2, b09: 2, b10: 1, b07: 2, b06: 2, b05: 2, b04: 2 },
  hand: { b08: 2, b09: 2, b10: 1, b07: 2, b06: 2, b05: 2, b04: 2 },
  social: { b08: 2, b09: 2, b10: 0, b07: 2, b06: 2, b05: 2, b04: 2 },
  vision: { b08: 2, b09: 1, b10: 0, b07: 2, b06: 2, b05: 2, b04: 2 },
  auditory: { b08: 2, b09: 1, b10: 0, b07: 2, b06: 2, b05: 2, b04: 2 },
  language: { b08: 0, b09: 0, b10: 0, b07: 1, b06: 2, b05: 2, b04: 2 },
};

const months = summariseAge(child.dob, assessedOn, undefined).assessedMonths;
const window = initialWindow(months);
const bandsByDomain = Object.fromEntries(
  DOMAINS.map((d) => [d.code, window.map((b) => b.id)]),
) as Record<DomainCode, string[]>;
const responses: Record<string, ResponseValue> = {};

function answer(domain: DomainCode, band: string) {
  const v = PLAN[domain][band] ?? 0;
  for (const item of itemsFor(band, domain)) responses[item.id] = v;
}
for (const d of DOMAINS) for (const b of window) answer(d.code, b.id);

// Run the same adaptive rounds the assessment flow runs.
let rounds = 0;
while (rounds < MAX_EXTENSION_ROUNDS) {
  const ext = extensionsFor(bandsByDomain, responses);
  if (!Object.values(ext).some((b) => b.length > 0)) break;
  for (const d of DOMAINS) {
    for (const band of ext[d.code]) {
      if (bandsByDomain[d.code].includes(band)) continue;
      bandsByDomain[d.code].push(band);
      answer(d.code, band);
    }
  }
  rounds += 1;
}

const record = {
  id: "demo",
  child,
  assessedOn,
  responses,
  bandsByDomain,
  bankVersion: BANK_VERSION,
  completedAt: `${assessedOn}T10:00:00.000Z`,
};

console.error(
  `seeded: ${Object.keys(responses).length} answers, ${rounds} adaptive round(s)`,
);
for (const d of DOMAINS) {
  console.error(`  ${d.code.padEnd(9)} bands: ${bandsByDomain[d.code].sort().join(" ")}`);
}
console.log(JSON.stringify({ demo: record }));
