import assert from "node:assert/strict";
import { test, describe } from "node:test";

import { AGE_BANDS, DOMAINS } from "@/content/domains";
import { itemsFor } from "@/content/items";
import { completedMonths, correctionMonths, summariseAge } from "@/lib/age";
import {
  MASTERY_THRESHOLD,
  MAX_EXTENSION_ROUNDS,
  bandForAge,
  developmentalAge,
  extensionsFor,
  initialWindow,
  scoreAssessment,
  statusFromDq,
} from "@/lib/scoring";
import type { DomainCode, ResponseValue } from "@/lib/types";

const ON = "2026-09-01";

/** Fill every item in the given bands with one value, for all domains. */
function fill(
  bandValues: Record<string, ResponseValue>,
): Record<string, ResponseValue> {
  const responses: Record<string, ResponseValue> = {};
  for (const [band, value] of Object.entries(bandValues)) {
    for (const domain of DOMAINS) {
      for (const item of itemsFor(band, domain.code)) {
        responses[item.id] = value;
      }
    }
  }
  return responses;
}

function windowMap(bands: { id: string }[]): Record<DomainCode, string[]> {
  return Object.fromEntries(
    DOMAINS.map((d) => [d.code, bands.map((b) => b.id)]),
  ) as Record<DomainCode, string[]>;
}

describe("age", () => {
  test("completed months ignores a partial month", () => {
    assert.equal(completedMonths("2024-07-01", "2026-09-01"), 26);
    assert.equal(completedMonths("2026-07-15", "2026-09-01"), 1);
  });

  test("preterm correction applies under 24 months and stops after", () => {
    // Born at 32 weeks is 8 weeks early, about 1.84 months.
    assert.ok(Math.abs(correctionMonths(32, 18) - 1.841) < 0.01);
    assert.equal(correctionMonths(32, 24), 0, "no correction past 24 months");
    assert.equal(correctionMonths(38, 10), 0, "term babies are not corrected");
    assert.equal(correctionMonths(undefined, 10), 0);
  });

  test("a preterm child is assessed against corrected age", () => {
    const age = summariseAge("2025-03-01", ON, 32);
    assert.equal(age.chronologicalMonths, 18);
    assert.equal(age.assessedMonths, 16);
    assert.equal(age.corrected, true);
  });
});

describe("band selection", () => {
  test("picks the band containing the age", () => {
    assert.equal(bandForAge(0).id, "b01");
    assert.equal(bandForAge(26).id, "b09");
    assert.equal(bandForAge(72).id, "b13");
  });

  test("ages past the top band clamp rather than throwing", () => {
    assert.equal(bandForAge(90).id, "b13");
  });

  test("the window is the band below, at, and above the child's age", () => {
    assert.deepEqual(
      initialWindow(26).map((b) => b.id),
      ["b08", "b09", "b10"],
    );
  });

  test("the window stays three bands wide at both ends of the range", () => {
    // Nothing exists below birth or above 72 months, so at the ends the window
    // slides rather than shrinking — the estimate still needs room to land.
    assert.deepEqual(initialWindow(1).map((b) => b.id), ["b01", "b02", "b03"]);
    assert.deepEqual(initialWindow(70).map((b) => b.id), ["b11", "b12", "b13"]);
    for (const months of [0, 1, 7, 26, 48, 60, 71, 72]) {
      assert.equal(
        initialWindow(months).length,
        3,
        `window at ${months} months was not three bands`,
      );
    }
  });
});

describe("developmental age", () => {
  const bands = AGE_BANDS.filter((b) => ["b08", "b09", "b10"].includes(b.id));

  test("interpolates partial credit into the next band", () => {
    // Masters 19-24 fully, half credit on 25-30, nothing on 31-36.
    // 24 + 0.5 x (30 - 24) = 27
    const responses = fill({ b08: 2, b09: 1, b10: 0 });
    const { months, bounded } = developmentalAge(bands, "mobility", responses);
    assert.equal(months, 27);
    assert.equal(bounded, null);
  });

  test("mastering everything asked is flagged as bounded above", () => {
    const responses = fill({ b08: 2, b09: 2, b10: 2 });
    const { months, bounded } = developmentalAge(bands, "mobility", responses);
    assert.equal(months, 36, "tops out at the highest band asked");
    assert.equal(bounded, "ceiling");
  });

  test("mastering nothing asked is flagged as bounded below", () => {
    const responses = fill({ b08: 0, b09: 0, b10: 0 });
    const { months, bounded } = developmentalAge(bands, "mobility", responses);
    assert.equal(months, 0);
    assert.equal(bounded, "floor");
  });

  test("the basal rule stops at the first band not mastered", () => {
    // Fails the lowest band but passes the highest. Should not credit the top.
    const responses = fill({ b08: 0, b09: 2, b10: 2 });
    const { months } = developmentalAge(bands, "mobility", responses);
    assert.ok(months < 19, `expected below 19 months, got ${months}`);
  });

  test("unanswered items leave the denominator instead of scoring zero", () => {
    const full = fill({ b08: 2, b09: 2 });
    const partial = { ...full };
    const drop = itemsFor("b09", "mobility")[0];
    delete partial[drop.id];
    assert.equal(
      developmentalAge(bands, "mobility", full).months,
      developmentalAge(bands, "mobility", partial).months,
      "skipping an item a child can do should not lower the score",
    );
  });
});

describe("status bands", () => {
  test("map the documented thresholds", () => {
    assert.equal(statusFromDq(100), "on_track");
    assert.equal(statusFromDq(90), "on_track");
    assert.equal(statusFromDq(89), "emerging");
    assert.equal(statusFromDq(75), "emerging");
    assert.equal(statusFromDq(74), "needs_focus");
    assert.equal(statusFromDq(60), "needs_focus");
    assert.equal(statusFromDq(59), "consult");
  });
});

/**
 * Run the adaptive rounds the way the assessment flow does: keep asking for
 * more bands until nothing new comes back, answering each new band with the
 * value the caller supplies.
 */
function runAdaptive(
  months: number,
  valueForBand: (bandId: string) => ResponseValue,
): {
  bandsByDomain: Record<DomainCode, string[]>;
  responses: Record<string, ResponseValue>;
  rounds: number;
} {
  const window = initialWindow(months);
  const bandsByDomain = windowMap(window);
  const responses: Record<string, ResponseValue> = {};

  const answerBand = (band: string) => {
    for (const domain of DOMAINS) {
      for (const item of itemsFor(band, domain.code)) {
        responses[item.id] = valueForBand(band);
      }
    }
  };
  window.forEach((b) => answerBand(b.id));

  let rounds = 0;
  while (rounds < MAX_EXTENSION_ROUNDS) {
    const ext = extensionsFor(bandsByDomain, responses);
    if (!Object.values(ext).some((b) => b.length > 0)) break;
    for (const domain of DOMAINS) {
      for (const band of ext[domain.code]) {
        if (!bandsByDomain[domain.code].includes(band)) {
          bandsByDomain[domain.code].push(band);
          answerBand(band);
        }
      }
    }
    rounds += 1;
  }
  return { bandsByDomain, responses, rounds };
}

describe("adaptive extension", () => {
  test("not mastering the lowest band asked reaches one band lower", () => {
    const bands = windowMap(initialWindow(26));
    const responses = fill({ b08: 1, b09: 0, b10: 0 });
    const ext = extensionsFor(bands, responses);
    assert.ok(
      ext.mobility.includes("b07"),
      "half marks on the lowest band is not mastery, so reach down",
    );
  });

  test("mastering the lowest band asked does not reach lower", () => {
    const bands = windowMap(initialWindow(26));
    const ext = extensionsFor(bands, fill({ b08: 2, b09: 1, b10: 0 }));
    assert.deepEqual(ext.mobility, []);
  });

  test("a ceiling score asks one band higher", () => {
    const bands = windowMap(initialWindow(26));
    const ext = extensionsFor(bands, fill({ b08: 2, b09: 2, b10: 2 }));
    assert.ok(ext.mobility.includes("b11"));
  });

  test("it keeps reaching down until it finds a band the child mastered", () => {
    // Answers "not yet" to everything above 10-12 months, but masters that.
    const { bandsByDomain, rounds } = runAdaptive(26, (band) =>
      ["b01", "b02", "b03", "b04", "b05"].includes(band) ? 2 : 0,
    );
    assert.ok(rounds >= 2, `expected several rounds, got ${rounds}`);
    assert.ok(
      bandsByDomain.mobility.includes("b05"),
      "should have reached down to 10-12 months",
    );
  });

  test("it terminates for a child who answers not yet to everything", () => {
    const { bandsByDomain, rounds } = runAdaptive(26, () => 0);
    assert.ok(rounds <= MAX_EXTENSION_ROUNDS);
    assert.ok(bandsByDomain.mobility.length <= 3 + MAX_EXTENSION_ROUNDS);
  });

  test("extension does not run off either end of the band list", () => {
    const low = windowMap(initialWindow(1));
    assert.deepEqual(
      extensionsFor(low, fill({ b01: 0, b02: 0, b03: 0 })).mobility,
      [],
      "nothing exists below the first band",
    );
    const high = windowMap(initialWindow(70));
    assert.deepEqual(
      extensionsFor(high, fill({ b11: 2, b12: 2, b13: 2 })).mobility,
      [],
      "nothing exists above the last band",
    );
  });
});

describe("no cliff across the mastery threshold", () => {
  /**
   * Regression test.
   *
   * The scoring once anchored a non-mastered lowest band to birth, so a child
   * at 74% of the 19-24 month band scored a developmental age of 14 months
   * while one at 75% scored 24 — a ten-month jump on a one percent difference.
   *
   * The fix is running the basal rule to completion: once a mastered band sits
   * underneath, crossing the threshold moves the estimate by about one band
   * boundary rather than by most of the child's life. This checks the whole
   * adaptive loop, not the formula in isolation.
   */
  function daAcrossThreshold(b08Value: ResponseValue): number {
    // Masters everything up to 16-18 months, then scores b08Value on 19-24.
    const { bandsByDomain, responses } = runAdaptive(26, (band) => {
      if (band === "b08") return b08Value;
      if (["b09", "b10", "b11"].includes(band)) return 0;
      return 2; // every band below 19 months is fully mastered
    });
    const bands = AGE_BANDS.filter((b) =>
      bandsByDomain.mobility.includes(b.id),
    );
    return developmentalAge(bands, "mobility", responses).months;
  }

  test("crossing the threshold moves the estimate by about one band", () => {
    const justUnder = daAcrossThreshold(1); // 50% of the band
    const justOver = daAcrossThreshold(2); // 100% of the band
    const jump = justOver - justUnder;

    assert.ok(
      justUnder >= 18,
      `a child with a mastered band underneath should be anchored there, got ${justUnder}`,
    );
    assert.ok(
      jump > 0 && jump <= 7,
      `expected a jump of at most one band width, got ${jump} months (${justUnder} to ${justOver})`,
    );
  });

  test("the estimate rises as answers improve", () => {
    const results = [0, 1, 2].map((v) => daAcrossThreshold(v as ResponseValue));
    assert.ok(
      results[0] < results[1] && results[1] < results[2],
      `developmental age should rise with better answers, got ${results.join(", ")}`,
    );
  });

  test("a child who masters nothing anywhere lands near the floor", () => {
    const { bandsByDomain, responses } = runAdaptive(26, () => 0);
    const bands = AGE_BANDS.filter((b) =>
      bandsByDomain.mobility.includes(b.id),
    );
    const { months, bounded } = developmentalAge(bands, "mobility", responses);
    assert.equal(months, 0);
    assert.equal(bounded, "floor");
  });
});

describe("whole assessments", () => {
  const child = { name: "Aarav", dob: "2024-07-01", gender: "boy" as const };

  test("a typical 26-month-old scores on track", () => {
    const bands = initialWindow(26);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ b08: 2, b09: 1, b10: 0 }),
      bandsByDomain: windowMap(bands),
    });
    assert.equal(result.assessedMonths, 26);
    assert.equal(result.corrected, false);
    // Developmental age 27 months against a chronological 26.0 → DQ ~104.
    assert.ok(
      result.overallDq !== null && result.overallDq >= 100,
      `expected DQ of about 104, got ${result.overallDq}`,
    );
    assert.equal(result.overallStatus, "on_track");
  });

  test("a globally behind child is flagged for consultation", () => {
    const bands = initialWindow(26);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ b08: 0, b09: 0, b10: 0 }),
      bandsByDomain: windowMap(bands),
    });
    assert.equal(result.overallStatus, "consult");
    assert.ok(result.overallDq !== null && result.overallDq < 60);
  });

  test("one weak domain is not averaged away by five strong ones", () => {
    const bands = initialWindow(26);
    const bandsByDomain = windowMap(bands);
    const responses = fill({ b08: 2, b09: 2, b10: 2 });
    // Knock language down to nothing while everything else stays maxed, then
    // let the adaptive rounds reach down for language the way the flow does.
    for (const b of ["b08", "b09", "b10"]) {
      for (const item of itemsFor(b, "language")) responses[item.id] = 0;
    }
    for (let round = 0; round < MAX_EXTENSION_ROUNDS; round++) {
      const ext = extensionsFor(bandsByDomain, responses);
      if (!Object.values(ext).some((b) => b.length > 0)) break;
      for (const domain of DOMAINS) {
        for (const band of ext[domain.code]) {
          if (bandsByDomain[domain.code].includes(band)) continue;
          bandsByDomain[domain.code].push(band);
          for (const item of itemsFor(band, domain.code)) {
            responses[item.id] = domain.code === "language" ? 0 : 2;
          }
        }
      }
    }
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses,
      bandsByDomain,
    });

    const language = result.domainScores.find((d) => d.domain === "language")!;
    assert.equal(language.status, "consult");
    assert.ok(
      bandsByDomain.language.length > bandsByDomain.mobility.length,
      "the weak domain should have been asked more bands than the strong ones",
    );
    assert.notEqual(
      result.overallStatus,
      "on_track",
      "a domain needing consultation must move the overall status",
    );
    assert.ok(
      result.focusAreas.includes("language"),
      "the weak domain must appear as a focus area",
    );
    assert.ok(!result.strengths.includes("language"));
  });

  test("a flat profile is not given a fake weakness", () => {
    const bands = initialWindow(26);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ b08: 2, b09: 2, b10: 2 }),
      bandsByDomain: windowMap(bands),
    });
    assert.equal(
      result.focusAreas.length,
      0,
      "every domain on track and level — nothing should be called a focus area",
    );
  });

  test("under four months the quotient is suppressed", () => {
    const baby = { name: "Meera", dob: "2026-07-15", gender: "girl" as const };
    const bands = initialWindow(1);
    const result = scoreAssessment({
      child: baby,
      assessedOn: ON,
      responses: fill({ b01: 2, b02: 2 }),
      bandsByDomain: windowMap(bands),
    });
    assert.equal(result.suppressDq, true);
    assert.equal(result.overallDq, null);
    for (const d of result.domainScores) assert.equal(d.dq, null);
    assert.equal(result.overallStatus, "on_track");
  });

  test("a preterm child is scored against corrected age", () => {
    const preterm = {
      name: "Ishaan",
      dob: "2025-03-01",
      gender: "boy" as const,
      gestationalWeeks: 32,
    };
    const bands = initialWindow(16);
    const responses = fill(
      Object.fromEntries(bands.map((b) => [b.id, 2 as ResponseValue])),
    );
    const result = scoreAssessment({
      child: preterm,
      assessedOn: ON,
      responses,
      bandsByDomain: windowMap(bands),
    });
    assert.equal(result.chronologicalMonths, 18);
    assert.equal(result.assessedMonths, 16);
    assert.equal(result.corrected, true);
  });

  test("items answered and item totals line up", () => {
    const bands = initialWindow(26);
    const responses = fill({ b08: 2, b09: 1, b10: 0 });
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses,
      bandsByDomain: windowMap(bands),
    });
    assert.equal(result.answeredCount, result.totalCount);
    assert.equal(result.answeredCount, Object.keys(responses).length);
  });
});

describe("item bank integrity", () => {
  test("every band has items in all six domains", () => {
    for (const band of AGE_BANDS) {
      for (const domain of DOMAINS) {
        const items = itemsFor(band.id, domain.code);
        assert.ok(
          items.length >= 3,
          `${band.label} / ${domain.name} has only ${items.length} items`,
        );
      }
    }
  });

  test("item ids are unique", () => {
    const all = AGE_BANDS.flatMap((b) =>
      DOMAINS.flatMap((d) => itemsFor(b.id, d.code)),
    );
    assert.equal(new Set(all.map((i) => i.id)).size, all.length);
  });

  test("every item carries a how-to-check instruction", () => {
    for (const band of AGE_BANDS) {
      for (const domain of DOMAINS) {
        for (const item of itemsFor(band.id, domain.code)) {
          assert.ok(
            item.how.length > 15,
            `${item.id} has no usable how-to-check text`,
          );
        }
      }
    }
  });

  test("no item uses discouraging language", () => {
    const banned = /\b(fail|failed|delay|delayed|deficit|abnormal|retard)/i;
    const all = AGE_BANDS.flatMap((b) =>
      DOMAINS.flatMap((d) => itemsFor(b.id, d.code)),
    );
    for (const item of all) {
      assert.ok(!banned.test(item.text), `${item.id}: "${item.text}"`);
      assert.ok(!banned.test(item.how), `${item.id} how: "${item.how}"`);
    }
  });
});
