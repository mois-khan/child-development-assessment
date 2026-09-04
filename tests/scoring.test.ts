import assert from "node:assert/strict";
import { test, describe } from "node:test";

import { DOMAINS } from "@/content/domains";
import { BRAIN_STAGES, STAGE_CELLS, cellFor } from "@/content/stages";
import { ITEMS, itemsFor, scoredItemsFor } from "@/content/items";
import { completedMonths, correctionMonths, summariseAge } from "@/lib/age";
import { STAGE_BOUNDARIES, classifyAgainstStage, stageForAge } from "@/lib/stage";
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
  test("has seven stages and forty-two cells", () => {
    assert.equal(BRAIN_STAGES.length, 7);
    assert.equal(STAGE_CELLS.length, 42);
    const numbers = STAGE_CELLS.map((c) => c.number).sort((a, b) => a - b);
    assert.deepEqual(numbers, Array.from({ length: 42 }, (_, i) => i + 1));
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

  test("the slow column is twice the average, so status and DQ agree", () => {
    for (const stage of BRAIN_STAGES) {
      assert.equal(stage.slowMonths, stage.averageMonths * 2, stage.roman);
      assert.ok(stage.superiorMonths < stage.averageMonths, stage.roman);
    }
  });
});

describe("picking the starting stage", () => {
  test("uses the nearest average, not the containing range", () => {
    // The two worked examples from the chart brief.
    assert.equal(stageForAge(2).roman, "II"); // 2 is nearer 2.5 than 1
    assert.equal(stageForAge(8).roman, "III"); // 8 is nearer 7 than 12
  });

  test("boundaries fall halfway between the averages", () => {
    assert.deepEqual(STAGE_BOUNDARIES, [1.75, 4.75, 9.5, 15, 27, 54]);
  });

  test("each stage wins the ages around its own average", () => {
    for (const stage of BRAIN_STAGES) {
      assert.equal(
        stageForAge(stage.averageMonths).id,
        stage.id,
        `${stage.roman} should own its own average`,
      );
    }
  });

  test("clamps at both ends of the chart", () => {
    assert.equal(stageForAge(0).roman, "I");
    assert.equal(stageForAge(600).roman, "VII");
  });

  test("a tie resolves downwards, never starting a child out of depth", () => {
    assert.equal(stageForAge(1.75).roman, "I");
    assert.equal(stageForAge(9.5).roman, "III");
  });

  test("preterm correction happens before the stage is picked", () => {
    // Born at 28 weeks: about three months early. At 6 months chronological
    // the child would start at Mid-Brain, but corrected to ~3 months they
    // start at Pons — a whole stage lower, which is the point of correcting.
    const preterm = childAged(6, { gestationalWeeks: 28 });
    const age = summariseAge(preterm.dob, ON, preterm.gestationalWeeks);
    assert.ok(age.corrected);
    assert.equal(startStageFor(age.chronologicalMonths).roman, "III");
    assert.equal(startStageFor(age.assessedMonths).roman, "II");
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
    assert.equal(nextStageFor(domain, [], {}, 8)?.roman, "III");
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
    const responses = fill({ s7: 1 }, 72);
    assert.equal(nextStageFor(domain, ["s7"], responses, 72), null);
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
  test("reaching a stage early is superior, on time is average, late is slow", () => {
    const s4 = BRAIN_STAGES[3]; // superior 6, average 12, slow 24
    assert.equal(classifyAgainstStage(s4, 6), "superior");
    assert.equal(classifyAgainstStage(s4, 12), "average");
    assert.equal(classifyAgainstStage(s4, 24), "slow");
    assert.equal(classifyAgainstStage(s4, 25), "consult");
  });

  test("a child on the average line scores a quotient of 100", () => {
    const child = childAged(12);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1, s5: 0 }, 12),
      stagesByDomain: everyDomain(["s4", "s5"]),
    });
    assert.equal(result.overallStatus, "average");
    for (const d of result.domainScores) {
      assert.equal(d.achievedStage, "s4");
      assert.equal(d.dq, 100);
      assert.equal(d.status, "average");
    }
  });

  test("a child a stage ahead of their age is on track, with the quotient showing how far", () => {
    // Twelve months old, reached stage V — whose average age is 18 months.
    // The chart's superior column for stage V is 9 months, so this child is
    // ahead but not superior. The band says on track; the number says 150.
    const child = childAged(12);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1, s5: 1, s6: 0 }, 12),
      stagesByDomain: everyDomain(["s4", "s5", "s6"]),
    });
    for (const d of result.domainScores) {
      assert.equal(d.achievedStage, "s5");
      assert.equal(d.status, "average");
      assert.equal(d.dq, 150);
    }
    assert.equal(result.overallStatus, "average");
  });

  test("a child at twice the chart's pace is superior", () => {
    // Nine months old, reached stage V — exactly its superior column.
    const child = childAged(9);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s5: 1, s6: 0 }, 9),
      stagesByDomain: everyDomain(["s5", "s6"]),
    });
    for (const d of result.domainScores) {
      assert.equal(d.status, "superior");
      assert.equal(d.dq, 200);
    }
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
      assert.equal(d.status, "slow"); // stage IV slow column is 24 months
      assert.equal(d.dq, 50);
    }
  });
});

describe("the overall verdict", () => {
  test("names the cell each competence landed in", () => {
    const child = childAged(12);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s4: 1, s5: 0 }, 12),
      stagesByDomain: everyDomain(["s4", "s5"]),
    });
    const vision = result.domainScores.find((d) => d.domain === "vision")!;
    assert.equal(vision.cell, cellFor("s4", "vision"));
    assert.equal(vision.cell.number, 19);
  });

  test("one struggling competence is not averaged away", () => {
    const child = childAged(12);
    // Five competences on the average line, one two stages below it.
    const responses = {
      ...fill({ s4: 1, s5: 0 }, 12),
      ...Object.fromEntries(
        scoredItemsFor("s4", "language", 12).map((i) => [i.id, 0 as ResponseValue]),
      ),
      ...Object.fromEntries(
        scoredItemsFor("s3", "language", 12).map((i) => [i.id, 0 as ResponseValue]),
      ),
      ...Object.fromEntries(
        scoredItemsFor("s2", "language", 12).map((i) => [i.id, 1 as ResponseValue]),
      ),
    };
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses,
      stagesByDomain: {
        ...everyDomain(["s4", "s5"]),
        language: ["s2", "s3", "s4"],
      },
    });

    const language = result.domainScores.find((d) => d.domain === "language")!;
    assert.equal(language.achievedStage, "s2");
    assert.ok(
      ["slow", "consult"].includes(language.status),
      `language came out ${language.status}`,
    );
    assert.notEqual(result.overallStatus, "average");
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
    assert.ok(result.suppressDq);
    assert.equal(result.overallDq, null);
    assert.ok(result.assessedMonths < MIN_AGE_FOR_DQ);
  });

  test("records the starting stage the age picked", () => {
    const child = childAged(8);
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s3: 1, s4: 0 }, 8),
      stagesByDomain: everyDomain(["s3", "s4"]),
    });
    assert.equal(result.startStage, "s3");
  });

  test("non-scoring answers are carried through as observations", () => {
    const child = childAged(72);
    const hand = itemsFor("s7", "hand", 72).find((i) => i.kind === "choice")!;
    const result = scoreAssessment({
      child,
      assessedOn: ON,
      responses: fill({ s7: 1 }, 72),
      details: { [hand.id]: "Right" },
      stagesByDomain: everyDomain(["s7"]),
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
