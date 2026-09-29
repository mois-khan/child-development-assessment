import re

with open('lib/scoring.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_score_assessment = '''export function scoreAssessment(input: ScoreInput): AssessmentResult {
  const { child, assessedOn, responses, stagesByDomain } = input;
  const details = input.details ?? {};
  const age = summariseAge(child.dob, assessedOn, child.gestationalWeeks);
  const months = age.assessedMonths;
  const suppressDq = false; // We use percentage now, no need to suppress

  const domainScores: DomainScore[] = DOMAINS.map((domain) => {
    const stageIds = stagesByDomain[domain.code] ?? [];
    const asked = sortStages(stageIds);
    const start = startStageFor(months);
    const startItems = itemsFor(start.id, domain.code, months).filter(i => i.kind === "yesno");
    const numBaseItems = startItems.length > 0 ? startItems.length : 1;
    const baseValuePerYes = 100 / numBaseItems;

    let baseScore = 0;
    let upBonus = 0;
    let downPenalty = 0;

    let raw = 0;
    let answered = 0;
    const achieved: Item[] = [];
    const notYet: Item[] = [];
    const observed: Record<string, string> = {};

    for (const stage of asked) {
      const items = itemsFor(stage.id, domain.code, months);
      for (const item of items) {
        if (item.kind !== "yesno") {
          const note = details[item.id];
          if (note !== undefined && note !== "") observed[item.id] = note;
          continue;
        }
        const v = responses[item.id];
        if (v === undefined) continue;
        
        const asExpected = item.invert ? 1 - v : v;
        raw += asExpected;
        answered += 1;
        
        if (asExpected === 1) achieved.push(item);
        else notYet.push(item);

        if (stage.id === start.id) {
            if (asExpected === 1) {
                baseScore += baseValuePerYes;
            }
        } else if (stage.order > start.order) {
            if (asExpected === 1) {
                upBonus += 10;
            }
        } else if (stage.order < start.order) {
            if (asExpected === 0) {
                downPenalty += 10;
            }
        }
      }
    }

    let finalPercent = baseScore + upBonus - downPenalty;
    if (finalPercent < 0) finalPercent = 0;
    finalPercent = Math.round(finalPercent);

    let status: StatusCode;
    if (finalPercent > 120) status = "A++";
    else if (finalPercent > 100) status = "A+";
    else if (finalPercent >= 80) status = "A";
    else if (finalPercent >= 50) status = "A-";
    else status = "A--";

    let highestPassedStage = null;
    for (const stage of asked) {
        const cell = readCell(stage.id, domain.code, responses, months);
        if (cell.answered > 0 && cell.passed) {
            highestPassedStage = stage;
        }
    }

    return {
      domain: domain.code,
      achievedStage: highestPassedStage?.id ?? start.id,
      cell: cellFor(highestPassedStage?.id ?? start.id, domain.code),
      stagesAsked: asked.map((s) => s.id),
      raw,
      max: answered,
      percent: finalPercent / 100,
      neurologicalMonths: finalPercent,
      dq: finalPercent,
      status,
      achieved,
      notYet,
      details: observed,
    };
  });

  const dqs = domainScores.map((d) => d.dq).filter((d): d is number => d !== null);
  const overallDq = dqs.length === 0 ? null : Math.round(dqs.reduce((a, b) => a + b, 0) / dqs.length);

  const severities = domainScores.map((d) => STATUS_SEVERITY[d.status]).sort((a, b) => a - b);
  const median = Math.ceil(
    (severities[Math.floor((severities.length - 1) / 2)] +
      severities[Math.ceil((severities.length - 1) / 2)]) /
      2,
  );
  let overallStatus: StatusCode = SEVERITY_STATUS[median] || "A";

  const statusFromMedian = overallStatus;
  const worstDomain = worstOf(domainScores.map((d) => d.status));
  
  if (worstDomain === "A--" && STATUS_SEVERITY[overallStatus] < 3) {
    overallStatus = "A-";
  } else if (worstDomain === "A-" && STATUS_SEVERITY[overallStatus] < 2) {
    overallStatus = "A";
  } else if (worstDomain === "A" && STATUS_SEVERITY[overallStatus] < 1) {
    overallStatus = "A+";
  }

  const overallRaisedBy =
    STATUS_SEVERITY[overallStatus] > STATUS_SEVERITY[statusFromMedian]
      ? ([...domainScores].sort(
          (a, b) => STATUS_SEVERITY[b.status] - STATUS_SEVERITY[a.status],
        )[0]?.domain ?? null)
      : null;

  const { strengths, focusAreas } = pickHighlights(domainScores);
  const allStages = new Set(Object.values(stagesByDomain).flat());

  return {
    assessedMonths: months,
    chronologicalMonths: age.chronologicalMonths,
    corrected: age.corrected,
    startStage: startStageFor(months).id,
    stages: BRAIN_STAGES.filter((s) => allStages.has(s.id)),
    domainScores,
    overallDq,
    overallStatus,
    overallRaisedBy,
    strengths,
    focusAreas,
    suppressDq,
    answeredCount: domainScores.reduce((n, d) => n + d.max, 0),
  };
}'''

content = re.sub(r'export function scoreAssessment\(input: ScoreInput\): AssessmentResult \{.*?\n\}', new_score_assessment, content, flags=re.DOTALL)

with open('lib/scoring.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated scoreAssessment in lib/scoring.ts")
