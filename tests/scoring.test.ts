import assert from "node:assert/strict";
import { test, describe } from "node:test";

import { DOMAINS } from "@/content/domains";
import { BRAIN_STAGES, STAGE_CELLS, cellFor } from "@/content/stages";
import { ITEMS, itemsFor, scoredItemsFor } from "@/content/items";
import { completedMonths, correctionMonths, summariseAge } from "@/lib/age";
import { STAGE_BOUNDARIES, classifyAgainstStage, stageForAge, stageStartMonths } from "@/lib/stage";
import { __setItemBankForTests } from "@/lib/item-bank";
import {
  MIN_AGE_FOR_DQ,
  PASS_THRESHOLD,
  achievedStageFor,
  neurologicalAge,
  nextStageFor,
  readCell,
  scoreAssessment,
  startStageFor,
} from "@/lib/scoring";
import type { Child, DomainCode, ResponseValue } from "@/lib/types";

// lib/scoring.ts reads through the live item bank (lib/item-bank.ts), which
// has no shipped fallback any more — prime it once from the same fixture
// content/items.ts still provides, so these tests exercise real questions.
__setItemBankForTests(ITEMS);

const ON = "2026-09-01";

/** A child whose corrected age on ON is exactly `months`. */
function childAged(months: number, extra: Partial<Child> = {}): Child {
  const on = new Date(`${ON}T00:00:00`);
  const dob = new Date(on.getFullYear(), on.getMonth() - months, on.getDate());
  const iso = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, "0")}-${String(
    dob.getDate(),
  ).padStart(2, "0")}`;
  return { name: "Test", dob: iso, gender: "other", ...extra };
}

/** Answer every scored item in the given stages with one value, all competences. */
function fill(
  stageValues: Record<string, ResponseValue>,
  months?: number,
): Record<string, ResponseValue> {
  const responses: Record<string, ResponseValue> = {};
  for (const [stage, value] of Object.entries(stageValues)) {
    for (const domain of DOMAINS) {
      for (const item of scoredItemsFor(stage, domain.code, months)) {
        // Inverted items are answered so the child comes out the same way:
        // "yes, they can" for value 1 means "no, they are not too floppy".
        responses[item.id] = (item.invert ? 1 - value : value) as ResponseValue;
      }
    }
  }
  return responses;
}

const everyDomain = <T,>(v: T) =>
  Object.fromEntries(DOMAINS.map((d) => [d.code, v])) as Record<DomainCode, T>;

/* ────────────────────────────────────────────────────────────────────────── */

describe("the chart itself", () => {
  test("has nine stages and fifty-four cells", () => {
    assert.equal(BRAIN_STAGES.length, 9);
    assert.equal(STAGE_CELLS.length, 54);
    const numbers = STAGE_CELLS.map((c) => c.number).sort((a, b) => a - b);
    assert.deepEqual(numbers, Array.from({ length: 54 }, (_, i) => i + 1));
  });

  test("every stage has questions for every competence", () => {
    for (const stage of BRAIN_STAGES) {
      for (const domain of DOMAINS) {
        const scored = scoredItemsFor(stage.id, domain.code);
        assert.ok(
          scored.length > 0,
          `${stage.roman} × ${domain.short} has no scored questions`,
        );
      }
    }
  });

  test("a six-year-old's age gate never empties a cell", () => {
    // The booklet's "if over six…" items are dropped for younger children.
    // Every cell must still have something scoreable left.
    for (const stage of BRAIN_STAGES) {
      for (const domain of DOMAINS) {
        assert.ok(
          scoredItemsFor(stage.id, domain.code, 0).length > 0,
          `${stage.roman} × ${domain.short} is empty for an infant`,
        );
      }
    }
  });

  test("item ids are unique", () => {
    assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length);
  });

  test("time frames are strictly ordered: superior < average < slow", () => {
    for (const stage of BRAIN_STAGES) {
      assert.ok(stage.superiorMonths < stage.averageMonths, `${stage.roman} superior < average`);
      assert.ok(stage.averageMonths < stage.slowMonths, `${stage.roman} average < slow`);
    }
  });
});

describe("picking the starting stage", () => {
  test("uses clinical bracket starting month, not nearest average", () => {
    assert.equal(stageForAge(0).roman, "I");
    assert.equal(stageForAge(1).roman, "II");
    assert.equal(stageForAge(2).roman, "II");
    assert.equal(stageForAge(2.5).roman, "III");
    assert.equal(stageForAge(3).roman, "III");
    assert.equal(stageForAge(7).roman, "IV");
    assert.equal(stageForAge(8).roman, "IV");
    assert.equal(stageForAge(12).roman, "V");
    assert.equal(stageForAge(13).roman, "V");
    assert.equal(stageForAge(18).roman, "VIA");
    assert.equal(stageForAge(27).roman, "VIB");
    assert.equal(stageForAge(28).roman, "VIB");
    assert.equal(stageForAge(36).roman, "VIIA");
    assert.equal(stageForAge(54).roman, "VIIB");
  });

  test("boundaries mark starting month of each stage bracket", () => {
    assert.deepEqual(STAGE_BOUNDARIES, [1, 2.5, 7, 12, 18, 27, 36, 54]);
  });

  test("each stage wins the ages in its bracket", () => {
    for (const stage of BRAIN_STAGES) {
      const testAge = stage.order === 1 ? 0.5 : stageStartMonths(stage);
      assert.equal(
        stageForAge(testAge).id,
        stage.id,
        `${stage.roman} should own its start age`,
      );
    }
  });

  test("clamps at both ends of the chart", () => {
    assert.equal(stageForAge(0).roman, "I");
    assert.equal(stageForAge(600).roman, "VIIB");
  });

  test("preterm correction happens before the stage is picked", () => {
    // Born at 28 weeks: about 3 months early. At 8 months chronological:
    // starts at Phase IV ([7, 12)), corrected by ~2.8 months to ~5.2 months:
    // starts at Phase III ([2.5, 7)).
    const preterm = childAged(8, { gestationalWeeks: 28 });
    const age = summariseAge(preterm.dob, ON, preterm.gestationalWeeks);
    assert.ok(age.corrected);
    assert.equal(startStageFor(age.chronologicalMonths).roman, "IV");
    assert.equal(startStageFor(age.assessedMonths).roman, "III");
  });
});

describe("reading a cell", () => {
  const domain: DomainCode = "mobility";

  test("all yes passes, all no fails", () => {
    const yes = fill({ s4: 1 });
    const no = fill({ s4: 0 });
    assert.ok(readCell("s4", domain, yes).passed);
    assert.ok(!readCell("s4", domain, no).passed);
  });

  test("inverted questions score backwards", () => {
    // Stage I mobility (b) is "are his arms and/or legs too tight or too
    // floppy?" — answering yes is the concerning answer.
    const items = scoredItemsFor("s1", "mobility");
    const inverted = items.find((i) => i.invert);
    assert.ok(inverted, "expected an inverted item at stage I mobility");

    const good: Record<string, ResponseValue> = {};
    for (const i of items) good[i.id] = i.invert ? 0 : 1;
    assert.ok(readCell("s1", "mobility", good).passed);

    const bad = { ...good, [inverted.id]: 1 as ResponseValue };
    assert.ok(!readCell("s1", "mobility", bad).passed);
  });

  test("unanswered questions leave the denominator", () => {
    const items = scoredItemsFor("s3", domain);
    const one = { [items[0].id]: 1 as ResponseValue };
    const cell = readCell("s3", domain, one);
    assert.equal(cell.answered, 1);
    assert.equal(cell.value, 1);
    assert.ok(cell.passed);
  });

  test("the threshold is what decides", () => {
    // Manufacture a cell answered exactly at the threshold and just under it.
    const items = scoredItemsFor("s3", "tactile"); // four questions
    assert.equal(items.length, 4);
    const three: Record<string, ResponseValue> = {};
    items.forEach((i, n) => (three[i.id] = n < 3 ? 1 : 0));
    assert.equal(readCell("s3", "tactile", three).value, 0.75);
    assert.equal(readCell("s3", "tactile", three).passed, 0.75 >= PASS_THRESHOLD);

    const two: Record<string, ResponseValue> = {};
    items.forEach((i, n) => (two[i.id] = n < 2 ? 1 : 0));
    assert.ok(!readCell("s3", "tactile", two).passed);
  });
});

describe("the ladder walk", () => {
  const domain: DomainCode = "vision";

  test("starts at the age-derived stage", () => {
    assert.equal(nextStageFor(domain, [], {}, 8)?.roman, "IV");
  });

  test("climbs while the child keeps passing", () => {
    const responses = fill({ s3: 1, s4: 1, s5: 0 }, 8);
    assert.equal(nextStageFor(domain, ["s3"], responses, 8)?.id, "s4");
    assert.equal(nextStageFor(domain, ["s3", "s4"], responses, 8)?.id, "s5");
    // s5 failed, and everything below it passed — settled.
    assert.equal(nextStageFor(domain, ["s3", "s4", "s5"], responses, 8), null);
  });

  test("descends while the child keeps failing", () => {
    const responses = fill({ s5: 0, s4: 0, s3: 1 }, 18);
    assert.equal(nextStageFor(domain, ["s5"], responses, 18)?.id, "s4");
    assert.equal(nextStageFor(domain, ["s4", "s5"], responses, 18)?.id, "s3");
    // s3 passed — settled.
    assert.equal(nextStageFor(domain, ["s3", "s4", "s5"], responses, 18), null);
  });

  test("never changes direction, so it always terminates", () => {
    // Walk every start stage against every possible all-yes / all-no child and
    // confirm the walk ends within the seven stages.
    for (const start of BRAIN_STAGES) {
      for (const value of [0, 1] as ResponseValue[]) {
        const responses = fill(
          Object.fromEntries(BRAIN_STAGES.map((s) => [s.id, value])),
          start.averageMonths,
        );
        const asked: string[] = [];
        let next = nextStageFor(domain, asked, responses, start.averageMonths);
        let rounds = 0;
        while (next && rounds < 20) {
          asked.push(next.id);
          next = nextStageFor(domain, asked, responses, start.averageMonths);
          rounds++;
        }
        assert.ok(rounds <= BRAIN_STAGES.length, `${start.roman} did not settle`);
      }
    }
  });

  test("stops at the top of the chart", () => {
    const responses = fill({ s7b: 1 }, 72);
    assert.equal(nextStageFor(domain, ["s7b"], responses, 72), null);
  });

  test("stops at the bottom of the chart", () => {
    const responses = fill({ s1: 0 }, 1);
    assert.equal(nextStageFor(domain, ["s1"], responses, 1), null);
  });

  test("will not move on from a half-answered stage", () => {
    const items = scoredItemsFor("s4", domain);
    const partial = { [items[0].id]: 1 as ResponseValue };
    assert.equal(nextStageFor(domain, ["s4"], partial, 12), null);
  });
});

describe("the stage a child reaches", () => {
  const domain: DomainCode = "mobility";

  test("is the highest passed with everything below it passed", () => {
    const responses = fill({ s3: 1, s4: 1, s5: 0 }, 12);
    const { stage } = achievedStageFor(domain, ["s3", "s4", "s5"], responses, 12);
    assert.equal(stage?.roman, "IV");
  });

  test("stops at the first stage not passed, not the highest passed", () => {
    // Passing a higher stage after failing a lower one does not count — the
    // lower one is the ceiling of what we can claim.
    const responses = { ...fill({ s3: 0, s5: 1 }, 12), ...fill({ s4: 0 }, 12) };
    const { stage } = achievedStageFor(domain, ["s3", "s4", "s5"], responses, 12);
    assert.equal(stage, null);
  });

  test("is null when even the lowest stage asked was not passed", () => {
    const responses = fill({ s1: 0 }, 1);
    const { stage } = achievedStageFor(domain, ["s1"], responses, 1);
    assert.equal(stage, null);
  });
});

describe("neurological age", () => {
  const domain: DomainCode = "tactile";

  test("is the achieved stage's average when nothing above was asked", () => {
    const responses = fill({ s4: 1 }, 12);
    assert.equal(neurologicalAge(domain, ["s4"], responses, 12), 12);
  });

  test("interpolates into the stage above", () => {
    // Stage IV fully (12 months), then half of stage V (18 months).
    const items = scoredItemsFor("s5", domain);
    const half: Record<string, ResponseValue> = {};
    items.forEach((i, n) => (half[i.id] = n === 0 ? 1 : 0));
    const responses = { ...fill({ s4: 1 }, 12), ...half };

    const expected = 12 + (1 / items.length) * (18 - 12);
    assert.equal(neurologicalAge(domain, ["s4", "s5"], responses, 12), expected);
  });

  test("interpolates below the chart when nothing was passed", () => {
    const items = scoredItemsFor("s1", domain);
    const some: Record<string, ResponseValue> = {};
    items.forEach((i, n) => (some[i.id] = n === 0 ? 1 : 0));
    const value = 1 / items.length;
    assert.equal(neurologicalAge(domain, ["s1"], some, 1), value * 1);
  });
});

describe("what the chart says about the result", () => {
  test("a child on the average line scores a quotient of 100", () => {
    const child = childAged(10);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1 }, 10),
      stagesByDomain: everyDomain(["s4"]),
    });
    assert.equal(result.overallStatus, "A");
    for (const d of result.domainScores) {
      assert.equal(d.achievedStage, "s4");
      assert.equal(d.percent, 1);
      assert.equal(d.status, "A");
    }
  });

  test("a child a stage ahead of their age is on track, with the quotient showing how far", () => {
    // 10 months old (starts at stage IV), passes stage IV and stage V (average 18 months).
    const child = childAged(10);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1, s5: 1 }, 10),
      stagesByDomain: everyDomain(["s4", "s5"]),
    });
    for (const d of result.domainScores) {
      assert.equal(d.achievedStage, "s5");
      assert.ok(d.percent > 1);
      assert.ok(["A+", "A++"].includes(d.status));
    }
    assert.ok(["A+", "A++"].includes(result.overallStatus));
  });

  test("a child at twice the chart's pace is superior", () => {
    // 8 months old (starts at stage IV), reaches stage VIA
    const child = childAged(8);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1, s5: 1, s6a: 1 }, 8),
      stagesByDomain: everyDomain(["s4", "s5", "s6a"]),
    });
    for (const d of result.domainScores) {
      assert.equal(d.status, "A++");
    }
    assert.equal(result.overallStatus, "A++");
  });

  test("a child at half their expected stage is slow", () => {
    const child = childAged(24);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1, s5: 0 }, 24),
      stagesByDomain: everyDomain(["s4", "s5"]),
    });
    for (const d of result.domainScores) {
      assert.equal(d.status, "A--"); // 50 <= 50
      
    }
  });
});

describe("the overall verdict", () => {
  test("names the cell each competence landed in", () => {
    const child = childAged(10);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1 }, 10),
      stagesByDomain: everyDomain(["s4"]),
    });
    const vision = result.domainScores.find((d) => d.domain === "vision")!;
    assert.equal(vision.cell, cellFor("s4", "vision"));
    assert.equal(vision.cell.number, 19);
  });

  test("one struggling competence is not averaged away", () => {
    const child = childAged(10);
    // Five competences on the average line (s4: 1), one two stages below it (s2: 1, s3: 0, s4: 0).
    const responses = {
      ...fill({ s4: 1 }, 10),
      ...Object.fromEntries(
        scoredItemsFor("s4", "language", 10).map((i) => [i.id, 0 as ResponseValue]),
      ),
      ...Object.fromEntries(
        scoredItemsFor("s3", "language", 10).map((i) => [i.id, 0 as ResponseValue]),
      ),
      ...Object.fromEntries(
        scoredItemsFor("s2", "language", 10).map((i) => [i.id, 1 as ResponseValue]),
      ),
    };
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses,
      stagesByDomain: {
        ...everyDomain(["s4"]),
        language: ["s2", "s3", "s4"],
      },
    });

    const language = result.domainScores.find((d) => d.domain === "language")!;
    assert.equal(language.achievedStage, "s2");
    assert.ok(
      ["A-", "A--"].includes(language.status),
      `language came out ${language.status}`,
    );
    assert.notEqual(result.overallStatus, "A");
    assert.equal(result.overallRaisedBy, "language");
    assert.ok(result.focusAreas.includes("language"));
  });

  test("no quotient is reported for a newborn", () => {
    const child = childAged(0);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s1: 1 }, 0),
      stagesByDomain: everyDomain(["s1"]),
    });
    assert.ok(result.suppressDq === false);
    assert.equal(result.overallDq, null);
    assert.ok(result.assessedMonths < MIN_AGE_FOR_DQ);
  });

  test("records the starting stage the age picked", () => {
    const child = childAged(8);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1 }, 8),
      stagesByDomain: everyDomain(["s4"]),
    });
    assert.equal(result.startStage, "s4");
  });

  test("non-scoring answers are carried through as observations", () => {
    const child = childAged(72);
    const hand = itemsFor("s7b", "hand", 72).find((i) => i.kind === "choice")!;
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s7b: 1 }, 72),
      details: { [hand.id]: "Right" },
      stagesByDomain: everyDomain(["s7b"]),
    });
    const manual = result.domainScores.find((d) => d.domain === "hand")!;
    assert.equal(manual.details[hand.id], "Right");
    assert.ok(!manual.achieved.some((i) => i.kind !== "yesno"));
  });
});

describe("age", () => {
  test("counts completed months", () => {
    assert.equal(completedMonths("2025-09-01", "2026-09-01"), 12);
    assert.equal(completedMonths("2025-09-15", "2026-09-01"), 11);
  });

  test("corrects for prematurity up to two years, then stops", () => {
    assert.ok(correctionMonths(32, 6) > 1.5);
    assert.equal(correctionMonths(38, 6), 0);
    assert.equal(correctionMonths(32, 24), 0);
  });
});
